/**
 * hàm format string giống như String.Format của C#
 * Created by tdmanh1 19/09/2024
 */
String.prototype.format =
  String.prototype.format ||
  function () {
    var arg = arguments
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof arg[number] != 'undefined' ? arg[number] : match
    })
  }

/**
 * Kiểm tra kiểu string null hoặc empty
 */
String.prototype.isNullOrEmpty =
  String.prototype.isNullOrEmpty ||
  function () {
    return !this
  }

/**
 * Kiểm tra string empty
 */
String.prototype.isEmpty =
  String.prototype.isEmpty ||
  function () {
    return this.length == 0
  }

/**
 * Kiểm tra string chứa 1 string
 */

String.prototype.contains =
  String.prototype.contains ||
  function (value) {
    return arguments && arguments[0] && this.indexOf(arguments[0]) > -1
  }

/**
 * Thay thế toàn bộ ký tự thỏa mãn điều kiện
 */

String.prototype.replaceAll = function (from, to) {
  return this.split(from).join(to)
}
/**
 * Thay thế toàn bộ ký tự thỏa mãn điều kiện
 */
String.prototype.capitalize =
  String.prototype.capitalize ||
  function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }
