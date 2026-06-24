// Design Pattern: Builder
// Tách rời việc xây dựng một đối tượng phức tạp khỏi biểu diễn của nó,
// cho phép cùng một quy trình xây dựng có thể tạo ra các biểu diễn khác nhau

namespace TDProject.Core.Business;

#region Product

/// <summary>
/// Sản phẩm phức tạp - Database Connection Configuration
/// Được xây dựng từ nhiều bước khác nhau
/// </summary>
public class DatabaseConfiguration
{
    #region Properties

    /// <summary>
    /// Các thuộc tính bắt buộc
    /// </summary>
    public string Server { get; set; } = string.Empty;
    public string Database { get; set; } = string.Empty;

    /// <summary>
    /// Các thuộc tính tùy chọn (có giá trị mặc định)
    /// </summary>
    public int Port { get; set; } = 5432;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = false;
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxPoolSize { get; set; } = 100;
    public bool EnableLogging { get; set; } = false;

    #endregion

    #region Methods

    /// <summary>
    /// Xây dựng connection string từ các tham số đã được thiết lập
    /// </summary>
    public string BuildConnectionString()
    {
        var parts = new List<string>
        {
            $"Server={Server}",
            $"Database={Database}",
            $"Port={Port}",
            $"Timeout={TimeoutSeconds}",
            $"Max Pool Size={MaxPoolSize}",
        };

        if (!string.IsNullOrEmpty(Username))
            parts.Add($"User Id={Username}");

        if (!string.IsNullOrEmpty(Password))
            parts.Add($"Password={Password}");

        if (UseSsl)
            parts.Add("SSL Mode=Require");

        if (EnableLogging)
            parts.Add("Logging=true");

        return string.Join(";", parts);
    }

    public override string ToString()
    {
        return BuildConnectionString();
    }

    #endregion
}

#endregion

#region Builder Interface

/// <summary>
/// Builder interface định nghĩa các bước xây dựng đối tượng DatabaseConfiguration
/// </summary>
public interface IDatabaseConfigurationBuilder
{
    void SetServer(string server);
    void SetDatabase(string database);
    void SetCredentials(string username, string password);
    void SetPort(int port);
    void ConfigureSsl(bool useSsl);
    void ConfigureTimeout(int seconds);
    void ConfigurePool(int maxSize);
    void EnableQueryLogging(bool enable);
    DatabaseConfiguration Build();
}

#endregion

#region Concrete Builder

/// <summary>
/// Builder cụ thể - implement tất cả các bước xây dựng
/// Cho phép xây dựng đối tượng từng bước một
/// </summary>
public class DatabaseConfigurationBuilder : IDatabaseConfigurationBuilder
{
    private readonly DatabaseConfiguration _config = new DatabaseConfiguration();

    public void SetServer(string server)
    {
        _config.Server = server;
    }

    public void SetDatabase(string database)
    {
        _config.Database = database;
    }

    public void SetCredentials(string username, string password)
    {
        _config.Username = username;
        _config.Password = password;
    }

    public void SetPort(int port)
    {
        _config.Port = port;
    }

    public void ConfigureSsl(bool useSsl)
    {
        _config.UseSsl = useSsl;
    }

    public void ConfigureTimeout(int seconds)
    {
        _config.TimeoutSeconds = seconds;
    }

    public void ConfigurePool(int maxSize)
    {
        _config.MaxPoolSize = maxSize;
    }

    public void EnableQueryLogging(bool enable)
    {
        _config.EnableLogging = enable;
    }

    public DatabaseConfiguration Build()
    {
        if (string.IsNullOrEmpty(_config.Server))
            throw new InvalidOperationException("Server is required");
        if (string.IsNullOrEmpty(_config.Database))
            throw new InvalidOperationException("Database is required");

        return _config;
    }
}

#endregion

#region Director (Optional)

/// <summary>
/// Director - định nghĩa quy trình xây dựng chuẩn cho các cấu hình phổ biến
/// Không bắt buộc, client có thể tự điều khiển builder trực tiếp
/// </summary>
public class DatabaseConfigurationDirector
{
    private readonly IDatabaseConfigurationBuilder _builder;

    public DatabaseConfigurationDirector(IDatabaseConfigurationBuilder builder)
    {
        _builder = builder;
    }

    /// <summary>
    /// Xây dựng cấu hình cho production server
    /// </summary>
    public DatabaseConfiguration BuildProductionConfig(string server, string database)
    {
        _builder.SetServer(server);
        _builder.SetDatabase(database);
        _builder.ConfigureSsl(true);
        _builder.ConfigureTimeout(60);
        _builder.ConfigurePool(200);
        _builder.EnableQueryLogging(true);
        return _builder.Build();
    }

    /// <summary>
    /// Xây dựng cấu hình cho development server
    /// </summary>
    public DatabaseConfiguration BuildDevelopmentConfig(string server, string database)
    {
        _builder.SetServer(server);
        _builder.SetDatabase(database);
        _builder.ConfigureSsl(false);
        _builder.ConfigureTimeout(30);
        _builder.ConfigurePool(10);
        _builder.EnableQueryLogging(false);
        return _builder.Build();
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Builder Pattern
/// </summary>
public class BuilderExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - xây dựng đối tượng từng bước một
    /// </summary>
    public void Run()
    {
        // Cách 1: Client tự điều khiển builder
        DatabaseConfigurationBuilder builder = new DatabaseConfigurationBuilder();
        builder.SetServer("localhost");
        builder.SetDatabase("TestDB");
        builder.SetCredentials("admin", "password123");
        builder.ConfigureSsl(true);
        builder.ConfigurePool(50);
        DatabaseConfiguration config1 = builder.Build();
        Console.WriteLine($"Config 1: {config1}");

        // Cách 2: Sử dụng director với quy trình chuẩn
        DatabaseConfigurationDirector director = new DatabaseConfigurationDirector(new DatabaseConfigurationBuilder());
        DatabaseConfiguration productionConfig = director.BuildProductionConfig("prod-server", "ProductionDB");
        Console.WriteLine($"Production Config: {productionConfig}");
    }

    #endregion
}
