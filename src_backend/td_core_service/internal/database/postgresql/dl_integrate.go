package postgresql

import (
	"context"
	"encoding/json"
	"fmt"
	"td_core_service/internal/database"
	"td_core_service/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

// DefaultQueryLimit là fallback nếu frontend không gửi default_limit.
const DefaultQueryLimit = 1000

// file này hướng tới việc gọi nối vào postgressl ở server khác
// coding sẽ là truyền từ UI vào
// chỉ có các config kết nối thì vẫn lưu ở sqlite của backend app

// Xóa toàn bộ connection thuộc 1 group (dùng khi xóa group)
func DeletePostgreSQLConnectionsByGroupID(groupID string) error {
	db, err := database.GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()
	_, err = db.Exec("DELETE FROM td_postgresql_connection WHERE group_id = ?", groupID)
	return err
}

// rawStatementResult lưu kết quả thô của 1 statement, CHƯA resolve tên bảng.
// Việc resolve OID -> tên bảng phải làm SAU khi MultiResultReader đã đóng hoàn toàn,
// vì không được gửi query khác trên cùng 1 connection trong lúc nó còn đang đọc dở.
type rawStatementResult struct {
	columns   []string
	tableOIDs []uint32
	rows      []map[string]any
	cmdTag    pgconn.CommandTag
}

// Thực hiện 1 hoặc nhiều câu lệnh SQL cách nhau bởi dấu ";" theo yêu cầu của User.
// Mỗi statement trả về 1 result set riêng
// Dùng Simple Query Protocol ở tầng pgconn (đọc nhiều result set trong 1 round-trip duy nhất).
// defaultLimit: 0 = không giới hạn, > 0 = hard cap.
func ExecutePostgreSQLQuery(connectionString string, sqlQuery string, defaultLimit int, unlimited bool) (*model.TDMultiQueryResult, error) {
	ctx := context.Background()

	// 1. Parse connection string ra object config
	config, err := pgx.ParseConfig(connectionString)
	if err != nil {
		return nil, fmt.Errorf("connection string không hợp lệ: %w", err)
	}

	// 2. ÉP BUỘC pgx sử dụng Simple Protocol để chạy được chuỗi nhiều câu lệnh
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// 3. Kết nối bằng config mới
	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối PostgreSQL: %w", err)
	}
	defer conn.Close(ctx)

	if unlimited {
		defaultLimit = 0
	} else if defaultLimit <= 0 {
		defaultLimit = DefaultQueryLimit
	}

	// 4. Gửi cả script lên server trong 1 lần, đọc lần lượt từng result set
	pgConn := conn.PgConn()
	mrr := pgConn.Exec(ctx, sqlQuery)

	var rawResults []rawStatementResult
	oidSet := make(map[uint32]struct{})

	for mrr.NextResult() {
		rr := mrr.ResultReader()

		fieldDescs := rr.FieldDescriptions()
		columns := make([]string, len(fieldDescs))
		tableOIDs := make([]uint32, len(fieldDescs))
		dataTypeOIDs := make([]uint32, len(fieldDescs))
		for i, fd := range fieldDescs {
			columns[i] = string(fd.Name)
			tableOIDs[i] = fd.TableOID
			dataTypeOIDs[i] = fd.DataTypeOID
			if fd.TableOID != 0 {
				oidSet[fd.TableOID] = struct{}{}
			}
		}

		var resultRows []map[string]any
		for rr.NextRow() {
			values := rr.Values() // [][]byte - dạng TEXT thô (Simple Protocol luôn trả text format)
			rowMap := make(map[string]any, len(columns))
			for i, col := range columns {
				rowMap[col] = decodeTextValue(values[i], dataTypeOIDs[i])
			}
			resultRows = append(resultRows, rowMap)
			if !unlimited && len(fieldDescs) > 0 && len(resultRows) >= defaultLimit {
				break
			}
		}

		cmdTag, closeErr := rr.Close()
		rawResults = append(rawResults, rawStatementResult{
			columns:   columns,
			tableOIDs: tableOIDs,
			rows:      resultRows,
			cmdTag:    cmdTag,
		})

		if closeErr != nil {
			// PostgreSQL dừng các statement còn lại của script khi 1 câu lỗi
			// (cả script chạy chung 1 implicit transaction).
			// Vẫn trả về các statement đã chạy thành công trước đó kèm lỗi.
			mrr.Close()
			result := buildMultiResult(ctx, conn, rawResults, oidSet)
			return result, fmt.Errorf("lỗi thực thi statement thứ %d: %w", len(rawResults), closeErr)
		}
	}

	if err := mrr.Close(); err != nil {
		result := buildMultiResult(ctx, conn, rawResults, oidSet)
		return result, fmt.Errorf("lỗi sau khi đọc kết quả: %w", err)
	}

	return buildMultiResult(ctx, conn, rawResults, oidSet), nil
}

// decodeTextValue chuyển 1 giá trị text thô Postgres trả về sang kiểu Go phù hợp để encode JSON.
//   - NULL                -> nil
//   - json / jsonb         -> json.RawMessage (giữ nguyên cấu trúc lồng nhau thay vì chuỗi escape)
//   - còn lại (uuid, số,
//     ngày giờ, mảng,...)  -> giữ nguyên dạng text Postgres trả về (không bị lỗi [16]byte như trước)
func decodeTextValue(raw []byte, dataTypeOID uint32) any {
	if raw == nil {
		return nil
	}
	switch dataTypeOID {
	case pgtype.JSONOID, pgtype.JSONBOID:
		return json.RawMessage(raw)
	case pgtype.BoolOID:
		// Simple protocol trả boolean dạng 't'/'f', cần đổi thành bool để JSON encode đúng true/false
		return len(raw) > 0 && raw[0] == 't'
	default:
		return string(raw)
	}
}

// buildMultiResult resolve tên bảng (1 lần cho mỗi OID xuất hiện trong toàn bộ script)
// rồi gói các rawStatementResult thành model.TDMultiQueryResult.
func buildMultiResult(ctx context.Context, conn *pgx.Conn, rawResults []rawStatementResult, oidSet map[uint32]struct{}) *model.TDMultiQueryResult {
	oidToName := resolveTableNames(ctx, conn, oidSet)

	results := make([]*model.TDQueryResult, 0, len(rawResults))
	for _, rr := range rawResults {
		tableNames := make([]string, len(rr.tableOIDs))
		for i, oid := range rr.tableOIDs {
			tableNames[i] = oidToName[oid] // "" nếu oid = 0 hoặc không tra được
		}

		isSelect := len(rr.columns) > 0
		rowsAffected := rr.cmdTag.RowsAffected()
		if isSelect {
			rowsAffected = int64(len(rr.rows))
		}

		results = append(results, &model.TDQueryResult{
			Columns:      rr.columns,
			TableNames:   tableNames,
			Rows:         rr.rows,
			RowsAffected: rowsAffected,
			IsSelect:     isSelect,
		})
	}

	return &model.TDMultiQueryResult{Results: results}
}

// resolveTableNames tra tên bảng cho từng OID xuất hiện trong script.
// CHỈ được gọi sau khi MultiResultReader đã Close() hoàn toàn (không được xen query
// khác vào giữa lúc đang đọc multi-result trên cùng 1 connection).
func resolveTableNames(ctx context.Context, conn *pgx.Conn, oidSet map[uint32]struct{}) map[uint32]string {
	oidToName := make(map[uint32]string, len(oidSet))
	for oid := range oidSet {
		var name string
		// ép kiểu sang int64 khi bind tham số rồi cast lại oid trong SQL để tránh
		// vấn đề pgx không có sẵn codec mặc định cho kiểu Go uint32
		err := conn.QueryRow(ctx, "SELECT relname FROM pg_class WHERE oid = $1::oid", int64(oid)).Scan(&name)
		if err == nil {
			oidToName[oid] = name
		}
	}
	return oidToName
}
