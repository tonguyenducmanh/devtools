// Design Pattern: Factory Method
// Định nghĩa interface cho việc tạo đối tượng, để class con quyết định loại đối tượng nào được tạo
// Pattern này phù hợp khi cần tách rời logic khởi tạo đối tượng khỏi class sử dụng

namespace TDProject.Core.Business;

#region Product Interface

/// <summary>
/// Interface cho các sản phẩm database connection
/// </summary>
public interface IDatabaseConnection
{
    /// <summary>
    /// Mở kết nối đến database
    /// </summary>
    void Connect();

    /// <summary>
    /// Thực thi câu lệnh SQL
    /// </summary>
    void ExecuteQuery(string sql);
}

#endregion

#region Concrete Products

/// <summary>
/// Kết nối SQL Server
/// </summary>
public class SqlServerConnection : IDatabaseConnection
{
    private readonly string _connectionString;

    public SqlServerConnection(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void Connect()
    {
        // todo - kết nối SQL Server
        Console.WriteLine($"Connecting to SQL Server: {_connectionString}");
    }

    public void ExecuteQuery(string sql)
    {
        // todo - thực thi query SQL Server
        Console.WriteLine($"SQL Server executing: {sql}");
    }
}

/// <summary>
/// Kết nối PostgreSQL
/// </summary>
public class PostgreSqlConnection : IDatabaseConnection
{
    private readonly string _connectionString;

    public PostgreSqlConnection(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void Connect()
    {
        // todo - kết nối PostgreSQL
        Console.WriteLine($"Connecting to PostgreSQL: {_connectionString}");
    }

    public void ExecuteQuery(string sql)
    {
        // todo - thực thi query PostgreSQL
        Console.WriteLine($"PostgreSQL executing: {sql}");
    }
}

#endregion

#region Factory

/// <summary>
/// Factory Method - tạo đối tượng IDatabaseConnection dựa trên loại database
/// Ưu điểm: không cần biết class cụ thể khi gọi, dễ mở rộng thêm loại mới
/// </summary>
public static class DatabaseConnectionFactory
{
    /// <summary>
    /// Tạo kết nối database tương ứng
    /// </summary>
    public static IDatabaseConnection CreateConnection(string dbType, string connectionString)
    {
        switch (dbType.ToLower())
        {
            case "sqlserver":
                return new SqlServerConnection(connectionString);
            case "postgresql":
                return new PostgreSqlConnection(connectionString);
            default:
                throw new ArgumentException($"Unsupported database type: {dbType}");
        }
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Factory Method
/// </summary>
public class FactoryMethodExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - không cần biết class cụ thể nào được tạo
    /// </summary>
    public void Run()
    {
        // Factory quyết định loại đối tượng nào được tạo dựa trên tham số đầu vào
        IDatabaseConnection sqlConn = DatabaseConnectionFactory.CreateConnection(
            "sqlserver",
            "Server=.;Database=Test;"
        );
        sqlConn.Connect();
        sqlConn.ExecuteQuery("SELECT * FROM Users");

        IDatabaseConnection pgConn = DatabaseConnectionFactory.CreateConnection(
            "postgresql",
            "Host=localhost;Database=Test;"
        );
        pgConn.Connect();
        pgConn.ExecuteQuery("SELECT * FROM Users");
    }

    #endregion
}
