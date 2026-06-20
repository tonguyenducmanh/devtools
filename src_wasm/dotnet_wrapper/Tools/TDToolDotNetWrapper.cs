using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql;

namespace TDTools
{
    /// <summary>
    /// Cấu hình các tùy chọn cho Source Generator (ví dụ: WriteIndented để tự động format đẹp)
    /// </summary>
    [JsonSourceGenerationOptions(WriteIndented = true)]
    [JsonSerializable(typeof(TDPosgreSQLCnonectionString))]
    public partial class TDToolPosgreSQlContextString : JsonSerializerContext
    {
    }

    /// <summary>
    /// Class biểu diễn dữ liệu đầu vào cho hàm CosinSimilarity
    /// (Đã bỏ kế thừa từ JsonSerializerContext vì đây là class chứa dữ liệu)
    /// </summary>
    public class TDPosgreSQLCnonectionString
    {
        /// <summary>
        /// tên user
        /// </summary>
        public string? user_name { get; set; }

        /// <summary>
        /// mật khẩu
        /// </summary>
        public string? password { get; set; }

        /// <summary>
        /// địa chỉ
        /// </summary>
        public string? host { get; set; }

        /// <summary>
        /// port của kết nối
        /// </summary>
        public int? port { get; set; }

        /// <summary>
        /// tên database
        /// </summary>
        public string? database_name { get; set; }
    }

    /// <summary>
    /// Class chứa danh sách các hàm tiện ích liên quan đến dev tool được viết bằng .NET
    /// </summary>
    public static partial class TDToolDotNetWrapper
    {
        /// <summary>
        /// đọc cấu hình connectionstring của NpgSQL rồi parse về thành object cụ thể
        /// cho UI, do mỗi 1 phiên bản NpqSQL lại có 1 cách lưu connection string khác nhau
        /// </summary>
        /// <param name="source">connection string đã lưu bằng NpgSQL</param>
        [JSExport]
        public static string ConvertNpgSQLConnection(string source)
        {
            string result = string.Empty;

            if (string.IsNullOrEmpty(source))
            {
                throw new ArgumentNullException(nameof(source));
            }

            NpgsqlConnectionStringBuilder npgParsedConnect = new NpgsqlConnectionStringBuilder(source);
            if (npgParsedConnect != null)
            {
                TDPosgreSQLCnonectionString connectionConvert = new TDPosgreSQLCnonectionString()
                {
                    user_name = npgParsedConnect.Username,
                    password = npgParsedConnect.Password,
                    host = npgParsedConnect.Host,
                    port = npgParsedConnect.Port,
                    database_name = npgParsedConnect.Database
                };

                // TRUYỀN TYPE AN TOÀN CHO TRIMMING/AOT Ở ĐÂY:
                // Sử dụng AppJsonContext.Default.TDPosgreSQLCnonectionString đã được sinh code sẵn
                result = JsonSerializer.Serialize(connectionConvert, TDToolPosgreSQlContextString.Default.TDPosgreSQLCnonectionString);
            }
            return result;
        }
    }
}