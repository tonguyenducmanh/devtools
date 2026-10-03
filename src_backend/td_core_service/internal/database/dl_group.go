package database

import (
	"database/sql"
	"fmt"
)

// ─────────────────────────────────────────────────────────────────────────────
// Master-detail (group - item) — các thao tác dùng chung cho mọi cặp bảng
//
// Mô hình master-detail của app luôn có cùng 1 cấu trúc:
//   - bảng master (group): chỉ cần id + name
//   - bảng detail (item):  có thêm khóa ngoại group_id
//
// File này gom toàn bộ logic chung của mô hình đó vào 1 chỗ, thay vì mỗi tool tự
// viết 1 hàm DELETE ... WHERE group_id = ? riêng (trước đây có 4 bản trùng nhau).
// ─────────────────────────────────────────────────────────────────────────────

// TDGroup là constraint cho bảng master của 1 cặp group - item.
//
// Ràng buộc này được compiler ép buộc: muốn dùng 1 type làm bảng master trong
// TDCollection thì type đó bắt buộc phải có id (GetID) và tên (GetName).
// Nhờ đó không thể vô tình đăng ký 1 bảng group mà thiếu id.
type TDGroup interface {
	TDModelBase
	// GetID trả về giá trị khóa chính của group hiện tại
	GetID() string
	// GetName trả về tên hiển thị của group hiện tại
	GetName() string
}

// TDGroupedItem là constraint cho bảng detail (item) thuộc 1 group.
// Item bắt buộc phải có khóa ngoại group_id, đó là điều kiện để gom được cây.
type TDGroupedItem interface {
	TDModelBase
	// GetGroupID trả về id của group chứa item này.
	// Trả về chuỗi rỗng nghĩa là item chưa được gán vào group nào.
	GetGroupID() string
}

// TDGroupTreeNode là 1 node của cây master-detail đã được gom sẵn ở tầng database.
//
// Encode ra JSON sẽ là: {"group": {...}, "items": [...], "is_ungrouped": false}
// Giữ group ở 1 field riêng thay vì flatten vào node để không phải lặp lại
// kiến thức về cột của bảng master (id, name, ...) ở nhiều chỗ.
type TDGroupTreeNode[TGroup TDGroup, TItem TDGroupedItem] struct {
	// Group là dữ liệu của bảng master
	Group TGroup `json:"group"`
	// Items là các item thuộc group này, luôn là mảng (không bao giờ null)
	Items []TItem `json:"items"`
	// IsUngrouped = true cho node ảo chứa các item chưa được gán group.
	// Node này không có trong bảng group nên Group sẽ là giá trị zero.
	IsUngrouped bool `json:"is_ungrouped"`
}

// BuildGroupTree gom group + item thành cây master-detail ngay ở tầng database.
//
// Đây là single source of truth của cây collection: frontend nhận thẳng cấu trúc đã
// group sẵn, không phải tự tải 2 list rồi gom lại ở từng tool (trước đây có 5 bản
// computed `groupedXxx` giống nhau).
//
//   - Group trả về theo thứ tự created_date DESC, đồng nhất với GetAll.
//   - Item không thuộc group nào, hoặc trỏ tới group đã bị xoá, được gom vào node
//     ảo IsUngrouped. Node ảo chỉ được trả về khi thực sự có item chứa trong đó,
//     nên caller không cần tự lọc lại như các bản UI cũ.
func BuildGroupTree[TGroup TDGroup, TItem TDGroupedItem]() ([]TDGroupTreeNode[TGroup, TItem], error) {
	groups, err := (&TDDLBase[TGroup]{}).GetAll()
	if err != nil {
		return nil, err
	}
	items, err := (&TDDLBase[TItem]{}).GetAll()
	if err != nil {
		return nil, err
	}
	return GroupRowsIntoTree(groups, items), nil
}

// GroupRowsIntoTree gom 2 danh sách đã đọc từ DB thành cây master-detail.
//
// Tách riêng khỏi BuildGroupTree để thuật toán gom cây test được độc lập với database,
// và để mỗi bước chỉ làm 1 việc: đọc dữ liệu / gom nhóm.
func GroupRowsIntoTree[TGroup TDGroup, TItem TDGroupedItem](
	groups []TGroup,
	items []TItem,
) []TDGroupTreeNode[TGroup, TItem] {
	// Index group theo id để gắn item O(1), tránh linear search cho từng item
	nodes := make([]TDGroupTreeNode[TGroup, TItem], len(groups))
	indexByGroupID := make(map[string]int, len(groups))
	for i := range groups {
		nodes[i] = TDGroupTreeNode[TGroup, TItem]{
			Group: groups[i],
			// luôn khởi tạo slice rỗng thay vì nil để frontend luôn nhận được mảng,
			// không phải null
			Items: []TItem{},
		}
		indexByGroupID[groups[i].GetID()] = i
	}

	// Node ảo cho item chưa gán group, chỉ tạo khi thực sự có item.
	// Group là giá trị zero: IsUngrouped là thứ phân biệt node ảo với group thật.
	var ungroupedGroup TGroup
	ungroupedIndex := -1
	for i := range items {
		nodeIndex, ok := indexByGroupID[items[i].GetGroupID()]
		if !ok {
			if ungroupedIndex == -1 {
				ungroupedIndex = len(nodes)
				nodes = append(nodes, TDGroupTreeNode[TGroup, TItem]{
					Group:       ungroupedGroup,
					IsUngrouped: true,
					Items:       []TItem{},
				})
			}
			nodeIndex = ungroupedIndex
		}
		nodes[nodeIndex].Items = append(nodes[nodeIndex].Items, items[i])
	}

	return nodes
}

// DeleteItemsByGroupID xoá toàn bộ item thuộc 1 group.
//
// Thay cho các hàm DeleteMockItemsByGroupID / DeleteTestingItemsByGroupID /
// DeleteTestingProModeItemsByGroupID / DeletePostgreSQLConnectionsByGroupID trước đây —
// 4 hàm giống hệt nhau chỉ khác tên bảng.
//
// Lưu ý: tên bảng lấy từ TableName() của model lúc biên dịch (compile-time constant),
// không phải input của user nên không có rủi ro SQL injection.
func DeleteItemsByGroupID[TItem TDGroupedItem](groupID string) error {
	var zero TItem
	query := fmt.Sprintf("DELETE FROM %s WHERE group_id = ?", zero.TableName())

	_, err := (&TDDLBase[TItem]{}).ExecRaw(query, groupID)
	return err
}

// DeleteGroupWithItems xoá group và toàn bộ item của group đó trong cùng 1 transaction.
//
// Đây là cascade delete của mô hình master-detail: xoá group phải không để lại item mồ côi.
// Transaction bảo đảm không có trạng thái nửa vời (đã xoá item nhưng còn group, hoặc ngược lại)
// khi app bị tắt đột ngột giữa chừng.
//
// Trả về số row đã xoá ở bảng group; bằng 0 nghĩa là không tìm thấy group.
func DeleteGroupWithItems[TGroup TDGroup, TItem TDGroupedItem](groupID string) (int64, error) {
	var zeroGroup TGroup
	var zeroItem TItem

	// Xoá item trước rồi mới xoá group, giữ đúng thứ tự để không chạm ràng buộc
	// ON DELETE RESTRICT nếu sau này có bật khai báo foreign key.
	deleteItemsQuery := fmt.Sprintf("DELETE FROM %s WHERE group_id = ?", zeroItem.TableName())
	deleteGroupQuery := fmt.Sprintf(
		"DELETE FROM %s WHERE %s = ?",
		zeroGroup.TableName(),
		zeroGroup.PrimaryKey(),
	)

	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}

	var deletedGroupRows int64
	err = withTx(db, func(tx *sql.Tx) error {
		if _, err := tx.Exec(deleteItemsQuery, groupID); err != nil {
			return err
		}
		result, err := tx.Exec(deleteGroupQuery, groupID)
		if err != nil {
			return err
		}
		deletedGroupRows, err = result.RowsAffected()
		return err
	})
	return deletedGroupRows, err
}
