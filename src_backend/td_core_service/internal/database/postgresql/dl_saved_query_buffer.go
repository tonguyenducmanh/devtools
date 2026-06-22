package postgresql

import (
	"log"
	"sync"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
	"time"
)

// savedQueryBuffer buffer ghi saved query không đồng bộ, tránh lock SQLite.
// Các INSERT được gom batch và flush theo chu kỳ.
var (
	savedQueryCh    chan model.TDPostgreSQLSavedQuery
	savedQueryOnce  sync.Once
	savedQueryClose chan struct{}
)

const (
	savedQueryBufSize    = 200   // dung lượng tối đa buffer
	savedQueryFlushEvery = 1     // giây
	savedQueryBatchSize  = 20    // số record tối đa mỗi batch
)

// InitPostgreSQLSavedQueryBuffer khởi tạo buffer + goroutine xử lý bất đồng bộ.
// Gọi 1 lần duy nhất khi app start.
func InitPostgreSQLSavedQueryBuffer() {
	savedQueryOnce.Do(func() {
		savedQueryCh = make(chan model.TDPostgreSQLSavedQuery, savedQueryBufSize)
		savedQueryClose = make(chan struct{})
		go savedQueryWorker()
	})
}

// ShutdownPostgreSQLSavedQueryBuffer dừng worker, flush nốt dữ liệu còn lại.
func ShutdownPostgreSQLSavedQueryBuffer() {
	close(savedQueryClose)
}

// PushPostgreSQLSavedQuery đẩy 1 saved query vào buffer để ghi bất đồng bộ.
// Generate UUID ngay tại đây để caller có thể dùng ngay.
func PushPostgreSQLSavedQuery(item *model.TDPostgreSQLSavedQuery) {
	if item.ID == "" {
		item.ID = td_common.GenUUID()
	}
	select {
	case savedQueryCh <- *item:
	default:
		log.Println("[WARN] saved query buffer đầy, bỏ qua 1 record")
	}
}

// savedQueryWorker đọc từ channel, gom batch và flush theo chu kỳ.
func savedQueryWorker() {
	ticker := time.NewTicker(savedQueryFlushEvery * time.Second)
	defer ticker.Stop()

	var batch []model.TDPostgreSQLSavedQuery
	flush := func() {
		if len(batch) == 0 {
			return
		}
		repo := database.TDDLBase[model.TDPostgreSQLSavedQuery]{}
		if err := repo.InsertBatch(batch); err != nil {
			log.Printf("[ERROR] flush saved query batch lỗi: %v", err)
		}
		batch = batch[:0]
	}

	for {
		select {
		case <-savedQueryClose:
			flush()
			return
		case item := <-savedQueryCh:
			batch = append(batch, item)
			if len(batch) >= savedQueryBatchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}
