// Design Pattern: Prototype
// Tạo đối tượng mới bằng cách sao chép từ một đối tượng có sẵn (prototype)
// Pattern này phù hợp khi việc tạo đối tượng mới tốn kém hơn so với sao chép

namespace TDProject.Core.Business;

#region Prototype Interface

/// <summary>
/// Interface cho khả năng clone đối tượng
/// </summary>
public interface IPrototype<T>
{
    /// <summary>
    /// Tạo bản sao shallow copy
    /// </summary>
    T ShallowClone();

    /// <summary>
    /// Tạo bản sao deep copy (copy toàn bộ object graph)
    /// </summary>
    T DeepClone();
}

#endregion

#region Concrete Prototype

/// <summary>
/// Cấu hình database connection - có thể clone để tạo các cấu hình tương tự
/// </summary>
public class DatabaseConfigPrototype : IPrototype<DatabaseConfigPrototype>
{
    #region Properties

    /// <summary>
    /// Kiểu dữ liệu tham chiếu (reference type) - cần deep clone
    /// </summary>
    public Dictionary<string, string> CustomProperties { get; set; }
        = new Dictionary<string, string>();

    /// <summary>
    /// Các thuộc tính kiểu giá trị (value type) - shallow clone là đủ
    /// </summary>
    public string Server { get; set; }
    public int Port { get; set; }
    public string Database { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public bool UseSsl { get; set; }
    public int TimeoutSeconds { get; set; }

    #endregion

    #region Methods

    /// <summary>
    /// Shallow clone - chỉ copy giá trị, reference type vẫn trỏ đến cùng object
    /// Dùng MemberwiseClone (gốc của Object)
    /// </summary>
    public DatabaseConfigPrototype ShallowClone()
    {
        return (DatabaseConfigPrototype)this.MemberwiseClone();
    }

    /// <summary>
    /// Deep clone - copy toàn bộ bao gồm cả reference type
    /// Dùng serialization hoặc tự copy thủ công
    /// </summary>
    public DatabaseConfigPrototype DeepClone()
    {
        DatabaseConfigPrototype clone = new DatabaseConfigPrototype
        {
            // Copy value types
            Server = this.Server,
            Port = this.Port,
            Database = this.Database,
            Username = this.Username,
            Password = this.Password,
            UseSsl = this.UseSsl,
            TimeoutSeconds = this.TimeoutSeconds,

            // Copy reference type bằng cách tạo mới
            CustomProperties = new Dictionary<string, string>(this.CustomProperties)
        };

        return clone;
    }

    /// <summary>
    /// In thông tin cấu hình (để kiểm tra)
    /// </summary>
    public void Display()
    {
        Console.WriteLine($"Server: {Server}, Port: {Port}, Database: {Database}");
        Console.WriteLine($"UseSsl: {UseSsl}, Timeout: {TimeoutSeconds}s");
        Console.WriteLine($"Custom Props: {CustomProperties.Count} items");
    }

    #endregion
}

#endregion

#region Prototype Manager (Optional)

/// <summary>
/// Quản lý các prototype có sẵn - registry pattern
/// </summary>
public class PrototypeRegistry
{
    private readonly Dictionary<string, DatabaseConfigPrototype> _prototypes
        = new Dictionary<string, DatabaseConfigPrototype>();

    /// <summary>
    /// Đăng ký prototype
    /// </summary>
    public void Register(string key, DatabaseConfigPrototype prototype)
    {
        _prototypes[key] = prototype;
        Console.WriteLine($"Registered prototype: {key}");
    }

    /// <summary>
    /// Lấy bản deep clone từ prototype đã đăng ký
    /// </summary>
    public DatabaseConfigPrototype CreateClone(string key)
    {
        if (!_prototypes.TryGetValue(key, out DatabaseConfigPrototype prototype))
            throw new KeyNotFoundException($"Prototype '{key}' not found");

        return prototype.DeepClone();
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Prototype Pattern
/// </summary>
public class PrototypeExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ
    /// </summary>
    public void Run()
    {
        // Tạo prototype gốc
        DatabaseConfigPrototype baseConfig = new DatabaseConfigPrototype
        {
            Server = "localhost",
            Port = 5432,
            Database = "master",
            Username = "admin",
            Password = "password",
            UseSsl = true,
            TimeoutSeconds = 30,
            CustomProperties = new Dictionary<string, string>
            {
                { "ApplicationName", "MyApp" }
            }
        };

        // Clone ra nhiều cấu hình khác nhau từ prototype
        DatabaseConfigPrototype devConfig = baseConfig.DeepClone();
        devConfig.Database = "dev_db";
        devConfig.Port = 5433;

        DatabaseConfigPrototype testConfig = baseConfig.DeepClone();
        testConfig.Database = "test_db";
        testConfig.CustomProperties["Environment"] = "Testing";

        Console.WriteLine("Base config:");
        baseConfig.Display();
        Console.WriteLine("\nDev config:");
        devConfig.Display();
        Console.WriteLine("\nTest config:");
        testConfig.Display();

        // Sử dụng Prototype Registry
        PrototypeRegistry registry = new PrototypeRegistry();
        registry.Register("base", baseConfig);
        DatabaseConfigPrototype cloned = registry.CreateClone("base");
        Console.WriteLine("\nCloned from registry:");
        cloned.Display();
    }

    #endregion
}
