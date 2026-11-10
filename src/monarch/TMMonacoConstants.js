/**
 * Các hằng số dùng chung cho Monaco editor.
 * Tách riêng khỏi TMMonacoActionConfig để JSON feature có thể import
 * mà không tạo vòng lặp phụ thuộc (action config -> registry -> json feature).
 */

/**
 * Group dành cho custom actions của TMTextEditor trên Monaco context menu.
 * Monaco hardcode group "navigation" luôn đứng đầu (sort logic trong menuService),
 * nên để action nằm ở trên cùng (trước "Go to Symbol", order 1.1) phải dùng đúng
 * group này kèm contextMenuOrder nhỏ.
 */
export const TM_MONACO_CONTEXT_GROUP_ID = "navigation";

/**
 * Ngôn ngữ mặc định của TMTextEditor khi component cha không truyền `language`.
 * Đặt ở đây để TMTextEditor không hardcode bất kỳ language id nào.
 */
export const TM_DEFAULT_MONACO_LANGUAGE = "javascript";
