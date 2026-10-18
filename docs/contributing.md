# Đóng góp

- **Ngôn ngữ:** Tiếng Việt là chính (comment, tài liệu, giao diện); i18n phải có cả `en/` và `vi/`. Code bám sát phong cách file xung quanh.
- **License:** MIT (`LICENSE`).
- **Quy ước đặt tên:** frontend `TM*` (component `TM*.vue`, class `TM*.js`, store `TM*.js`, mixin `TM*Mixin.js`, directive `TM*.js`); backend file `tm_*.go` + tiền tố tầng `bl_` (service), `dl_` (database), `rt_` (router).
- **Không commit artifact:** xem Luật 12 trong `AGENTS.md` (`dist/`, `out/`, `node_modules/`, `config.json`, `*.db*`, `src_wasm/pkg/`, `src_wasm/*/external_repo/`).
- **Commit:** nhỏ, 1 ý/commit; subject rõ nghĩa (có thể tiếng Việt ngắn gọn).
- **Chưa có CI/test frontend:** tự smoke-test kỹ trên `npm run dev`; Go chạy `go test ./...` module đụng đến.
- **Main thread không được block:** xử lý nặng tách worker (xem mục "Tác vụ nặng"); luôn báo tiến trình và để user thao tác được tab khác trong lúc chờ.

## Thêm một tool (frontend)

1. **Tạo component** `src/views/tools/TM<Thing>.vue` (thư mục con riêng nếu tool phức tạp, ví dụ `APITesting/`, `PostgreSQLQuery/`). Mẫu:
   ```vue
   <template>
     <div class="flex container">…</div>
   </template>
   <script>
   import TMToolBase from "@/views/tools/base/TMToolBase.vue";
   export default {
     name: "TMThing",
     extends: TMToolBase,
     // data/methods/computed như component Vue bình thường
   };
   </script>
   ```
   `TMToolBase` cung cấp vòng đời tab: `onTabEnter/onTabLeave`, `reBuildTabTitle`, `toggleSidebar`, mixin layout (`currentConfigLayout`).
2. **Đăng ký** trong `src/stores/TMToolConfigs.js`:
   - Tool đơn lẻ: thêm entry `{ type: "route", name, component: () => import(...), meta: { titleKey } }`.
   - Tool trong nhóm: thêm con vào mảng `children` của group có sẵn (hoặc tạo group mới với `groupKey`, `groupTitleKey`).
   - `hide: true` nếu chưa muốn hiện trên sidebar (vẫn search được nếu cần chỉnh `getAllSearchableRoutes`).
   - **Layout vùng nội dung tab (tuỳ chọn):** khai báo ở cấp group `contentFlush: true` (tool tự lo bố trí, ví dụ app vẽ canvas → không padding) và/hoặc `confirmOnClose: true` (tool có dữ liệu tạm chưa lưu → đóng tab sẽ hỏi xác nhận). Ghi đè riêng cho 1 tool bằng `meta.contentFlush` / `meta.confirmOnClose`.
3. **i18n:** thêm `$t` key vào `src/i18n/vi/i18nCommon.js` **và** `src/i18n/en/i18nCommon.js` cho `titleKey` + mọi chuỗi trong UI. Tiêu đề tab tự hiển thị từ `meta.titleKey`.
4. **(Tùy chọn) Help:** tạo `src/views/helps/TM<Thing>Help.vue` và nối `helpKey` trong tab meta; nội dung help đặt trong `i18nHelp`.
5. **(Tùy chọn) Dialog:** `TMDialogEnum` + `DialogComponentMap` nằm trong `src/common/TMDialogUtil.js` — thêm enum ở **cuối** `TMDialogEnum`, mapping trong `DialogComponentMap`, tạo component trong `src/views/dialogs/` (implement `show(param)`).
6. **(Tùy chọn) Monaco intellisense:** override `registerIntellisense()`/`disposeIntellisense()` trong tool; định nghĩa ngôn ngữ ở `src/monarch/`.
7. **Tool cần lưu cấu hình:** kế thừa `TMLayoutConfigMixin` (cache key `keyCacheLayout`). Tool master-detail GHÉP với backend: dùng `TMCollectionMixin` + `TMCollectionList` (xem mục backend).
8. **Tool xử lý nặng:** nếu có bước block main thread >~200ms (duyệt/xử lý ảnh, encode, parse dữ liệu lớn, vòng lặp nặng) → tách sang Web Worker qua `TMWorkerPool`, không tối ưu bằng `await` hay `setTimeout`. Xem mục "Tác vụ nặng" bên dưới.

## Tác vụ nặng (Web Worker)

Mẫu tham chiếu: `src/common/qrcode/` (đọc + sinh mã QR).

```js
// 1. Worker file: src/common/<miền>/TM<Miền>Worker.js — KHÔNG import gì chạm DOM
import { process } from "<lib thuần>";
self.addEventListener("message", (e) => {
  taskChain = taskChain.then(() => handle(e.data)).catch(sendError); // serialize!
});
// 2. Client: src/common/<miền>/TM<Miền>WorkerClient.js
const pool = getWorkerPool("<tên>", () =>
  new Worker(new URL("./TM<Miền>Worker.js", import.meta.url), { type: "module" }),
);
```

Ba lỗi hay gặp nhất — đều dính rồi nên ghi lại:

1. **`new Worker(new URL(...))` phải literal.** Truyền qua biến sẽ không được Vite transform, build vẫn xanh nhưng lúc chạy worker không tồn tại. Kiểm tra bằng cách `curl` file client trên dev server và xem đã thành `...?worker_file&type=module` chưa.
2. **Payload phải clone được.** Object trong `data()` của Vue là reactive `Proxy` → `DataCloneError` khi postMessage. Hằng số đặt ngoài component hoặc `markRaw()`. Function/DOM node cũng không được.
3. **Worker không có DOM.** `createImageBitmap(blob)` thay `Image`/`FileReader`; `OffscreenCanvas` + `convertToBlob()` thay canvas DOM; `ImageData` có sẵn. Phần cần DOM giữ lại làm fallback ở main thread và chỉ chạy khi worker không xử lý được.

Ngoài ra: báo tiến trình (spinner + x/y), dùng token để lần gọi sau không bị lần trước đè, và nhớ `worker.rollupOptions.output` trong `vite.config.js` để file worker giữ prefix `tjs-` + version chống cache CDN. Chi tiết: `AGENTS.md` Luật 13 + `docs/architecture.md`.

## Thêm một API (backend)

1. **Model** trong `src_backend/tm_core_service/internal/model/`: struct embed `TMBaseModel`, implement `TableName()` + `PrimaryKey()`, tag `json` đúng tên cột.
2. **Router** `internal/router/rt_<domain>.go`: đăng ký endpoint (`app.HandleFunc("POST /domain/action", …)`) kiểu method-pattern.
3. **Service** `internal/service/bl_<domain>.go`: nếu là CRUD → tái dùng `TMBLBase[T]` hoặc `TMCollection[TGroup,TItem]` (tự sinh `get_all/create/update/delete_by_id/get_tree`); gắn hook `BeforeInsert/…` khi cần logic thêm. Trả `{success, message, data}`.
4. **Database** `internal/database/dl_<domain>.go`: dùng `TMDLBase[T]`; migration mới thêm file `migrations/000N_*.sql` (idempotent).
5. **Frontend gọi:** thêm class `src/common/api/request/AgentAPI/TMServer<Domain>API.js` (extend `TMBaseAPI`, không hard-code baseUrl) rồi dùng trong tool.

Tiêu chí xem có cần thêm backend không: việc **phải** ở máy local (SQLite, file, proxy mạng, nhạy cảm) → daemon; còn lại làm thuần frontend để bản web-hosted chạy được.

## Quy ước UI/i18n/style

- Dùng component global `TMButton`, `TMInput`, `TMComboBox`, `TMPopup`, `TMTableViewer`, … (đăng ký sẵn trong `main.js`).
- Toast: `this.$tmToast.success/error/warning/info(...)`. Dialog: `TMDialogUtil.showPopup(...)` / `confirm(...)`.
- SCSS trong `src/styles/*.scss`; biến theme CSS trong `src/index.css` (`:root`). Không hard-code màu chung.
- Đặt tên key i18n theo dạng dấu chấm: `i18nCommon.<feature>.<nội dung>`; tool title trong `i18nCommon.feature.*`.
- Backend: xử lý input cẩn thận (index/len từ người dùng), không panic; log qua helper `tm_common/bl_common_log.go` thay vì `fmt.Println` rải rác (mở rộng nếu cần).

## Checklist trước khi hoàn tất

```sh
npm run dev          # smoke-test tool mới/chỉnh sửa
npm run build        # PHẢI xanh
cd src_backend/tm_config && go build ./...
cd ../tm_core_service && go build ./... && go vet ./... && go test ./...
cd ../tm_app && go build ./...
```

Nếu đụng Web Worker, `npm run build` xanh **chưa đủ** — phải kiểm tra thêm: dev server đã transform đúng `new Worker(new URL(...))` chưa; `dist/assets/` có file worker với prefix `tjs-` + version; và chạy thật trong browser với tác vụ nặng để xác nhận main thread vẫn phản hồi (đếm tick của `setInterval(…, 16)` trong lúc chờ). Chi tiết ở `AGENTS.md` mục 5.

Cập nhật `README.md` / `docs/` nếu hành vi hay quy trình build đổi. Không commit artifact (Luật 12, `AGENTS.md`).