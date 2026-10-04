package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"tm_core_service/internal/database"
)

// errCollectionNotFound trả về khi xoá 1 group không tồn tại.
var errCollectionNotFound = errors.New("Không tìm thấy dữ liệu")

// ─────────────────────────────────────────────────────────────────────────────
// TMCollection — đơn vị duy nhất xử lý toàn bộ nghiệp vụ CRUD của 1 cặp
// master-detail (group - item).
//
// Trước khi có TMCollection, mỗi tool phải tự viết 2 controller riêng + 1 hook
// BeforeDelete để cascade delete item (5 bản gần như giống hệt nhau).
// Giờ mỗi tool chỉ cần khai báo 2 path prefix là xong, phần còn lại kế thừa
// hook sẵn có của TMBLBase nếu cần logic riêng.
// ─────────────────────────────────────────────────────────────────────────────

// TMCollection gom controller của bảng master (group) và bảng detail (item).
//
//	type TMCollection[TGroup database.TMGroup, TItem database.TMGroupedItem] struct {
//	    Group    *TMBLBase[TGroup]  // CRUD group, đã gắn cascade delete item
//	    Item     *TMBLBase[TItem]   // CRUD item
//	    ItemPath string             // prefix route của item
//	}
//
// Cách dùng:
//
//	c := NewCollection[model.TMAPIMockGroup, model.TMAPIMockItem]("mock_group", "mock_api")
//	c.Item.AfterInsert = restartMockServerAfterMockChange  // hook riêng của tool
//	c.RegisterRoutes(app)
type TMCollection[TGroup database.TMGroup, TItem database.TMGroupedItem] struct {
	// Group là controller CRUD của bảng master.
	// BeforeDelete đã được tự động gắn cascade delete item, nếu tool cần validate
	// hoặc xử lý gì thêm thì ghi đè qua c.SetGroupBeforeDelete để không mất cascade.
	Group *TMBLBase[TGroup]
	// Item là controller CRUD của bảng detail, tool tự gắn hook riêng vào đây.
	Item *TMBLBase[TItem]
	// ItemPath là prefix route của item, endpoint get_tree dùng chung prefix này
	// để frontend chỉ cần biết 1 tên là đủ.
	ItemPath string

	// Hook của bảng master do tool đăng ký, được ghép với cascade delete
	// (xem SetGroupBeforeDelete / SetGroupAfterDelete).
	groupBeforeDelete func(id string, r *http.Request) error
	groupAfterDelete  func(id string, r *http.Request)
}

// NewCollection khởi tạo 1 cặp master-detail với đầy đủ route CRUD và cascade delete.
//
//	groupPath: prefix route của bảng master, vd: "mock_group"
//	itemPath : prefix route của bảng detail, vd: "mock_api"
func NewCollection[TGroup database.TMGroup, TItem database.TMGroupedItem](
	groupPath string,
	itemPath string,
) *TMCollection[TGroup, TItem] {
	return &TMCollection[TGroup, TItem]{
		Group: &TMBLBase[TGroup]{
			// PathPrefix phải set ngay tại đây: TMBLBase.RegisterRoutes dựng pattern
			// từ PathPrefix, thiếu nó sẽ đăng ký route sai (vd: "GET //get_all")
			// và http.ServeMux panic lúc khởi động.
			PathPrefix: groupPath,
			Repo:       database.TMDLBase[TGroup]{},
		},
		Item: &TMBLBase[TItem]{
			PathPrefix: itemPath,
			Repo:       database.TMDLBase[TItem]{},
		},
		ItemPath: itemPath,
	}
}

// SetGroupBeforeDelete đăng ký hook chạy trước khi xoá group (vd: validate, dọn cache).
//
// Hook này được ghép với cascade delete, không ghi đè mất nó — nên gọi hàm này thay vì
// gán trực tiếp c.Group.BeforeDelete.
func (c *TMCollection[TGroup, TItem]) SetGroupBeforeDelete(hook func(id string, r *http.Request) error) {
	c.groupBeforeDelete = hook
}

// SetGroupAfterDelete đăng ký hook chạy sau khi xoá group (vd: restart mock server).
func (c *TMCollection[TGroup, TItem]) SetGroupAfterDelete(hook func(id string, r *http.Request)) {
	c.groupAfterDelete = hook
}

// RegisterRoutes đăng ký toàn bộ endpoint của 1 cặp master-detail:
//
//	GET    /{groupPath}/get_all
//	POST   /{groupPath}/create
//	PUT    /{groupPath}/update
//	DELETE /{groupPath}/delete_by_id      (cascade xoá luôn item)
//
//	GET    /{itemPath}/get_all
//	POST   /{itemPath}/create
//	PUT    /{itemPath}/update
//	DELETE /{itemPath}/delete_by_id
//
//	GET    /{itemPath}/get_tree            (group + item đã gom sẵn)
func (c *TMCollection[TGroup, TItem]) RegisterRoutes(app *http.ServeMux) {
	c.groupController().RegisterRoutes(app)
	c.Item.RegisterRoutes(app)

	// Endpoint cây đặt cạnh item để frontend chỉ cần nhớ 1 path prefix
	app.HandleFunc(fmt.Sprintf("GET /%s/get_tree", c.ItemPath), c.GetTree)
}

// groupController trả về controller của bảng master, đã gắn sẵn cascade delete
// item trong transaction. Hook do tool đăng ký được ghép vào chứ không bị ghi đè.
func (c *TMCollection[TGroup, TItem]) groupController() *TMBLBase[TGroup] {
	// shallow copy: giữ nguyên hook của tool, chỉ thay phần xử lý xoá
	controller := *c.Group

	controller.BeforeDelete = func(id string, r *http.Request) error {
		if c.groupBeforeDelete != nil {
			if err := c.groupBeforeDelete(id, r); err != nil {
				return err
			}
		}
		return nil
	}

	controller.CustomDelete = func(id string, r *http.Request) error {
		deletedRows, err := database.DeleteGroupWithItems[TGroup, TItem](id)
		if err != nil {
			return err
		}
		if deletedRows == 0 {
			return errCollectionNotFound
		}
		return nil
	}

	controller.AfterDelete = c.groupAfterDelete

	return &controller
}

// GetTree trả về cây group + item đã gom sẵn ở tầng server.
//
// Nhờ endpoint này, frontend không còn phải tải 2 list rồi tự gom cây ở mỗi tool.
func (c *TMCollection[TGroup, TItem]) GetTree(w http.ResponseWriter, r *http.Request) {
	tree, err := database.BuildGroupTree[TGroup, TItem]()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tree,
	})
}
