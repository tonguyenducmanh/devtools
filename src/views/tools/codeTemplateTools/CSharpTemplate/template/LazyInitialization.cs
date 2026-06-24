// Lazy Initialization trong C#
// Trì hoãn việc khởi tạo đối tượng cho đến khi nó thực sự được sử dụng lần đầu tiên
// Giúp tiết kiệm tài nguyên (memory, CPU) khi đối tượng có thể không bao giờ được dùng đến
// C# có sẵn Lazy<T> giúp implement pattern này dễ dàng và thread-safe

namespace TDProject.Core.Business;

#region Lazy Singleton với Lazy<T>

/// <summary>
/// Singleton sử dụng Lazy<T> - thread-safe, đơn giản nhất
/// Lazy<T> đảm bảo chỉ tạo 1 lần và an toàn với đa luồng
/// </summary>
public class LazySingleton
{
    #region Declare

    /// <summary>
    /// Lazy<T> tự động xử lý thread-safety
    /// LazyThreadSafetyMode.ExecutionAndPublication: thread-safe, singleton guarantee
    /// Lazy<T> chỉ gọi factory method 1 lần duy nhất dù có nhiều thread cùng truy cập
    /// </summary>
    private static readonly Lazy<LazySingleton> _lazyInstance =
        new Lazy<LazySingleton>(
            () => new LazySingleton(),
            LazyThreadSafetyMode.ExecutionAndPublication
        );

    /// <summary>
    /// Theo dõi có bao nhiêu lần instance được tạo
    /// </summary>
    private static int _instanceCount = 0;

    #endregion

    #region Constructor

    private LazySingleton()
    {
        int count = Interlocked.Increment(ref _instanceCount);
        Console.WriteLine($"LazySingleton instance created. Count: {count} (should be 1)");
    }

    #endregion

    #region Properties

    /// <summary>
    /// Instance duy nhất, chỉ được tạo khi truy cập lần đầu
    /// Nếu không ai gọi Instance, đối tượng sẽ không bao giờ được tạo
    /// </summary>
    public static LazySingleton Instance => _lazyInstance.Value;

    #endregion

    #region Methods

    public void DoWork()
    {
        Console.WriteLine("LazySingleton is working");
    }

    #endregion
}

#endregion

#region Lazy Initialization với custom logic

/// <summary>
/// Ví dụ lazy initialization với tài nguyên tốn kém (database connection, configuration)
/// </summary>
public class LazyResourceLoader
{
    #region Declare

    /// <summary>
    /// Lazy load configuration từ file
    /// Chỉ đọc file khi thực sự cần, tiết kiệm I/O nếu không dùng đến
    /// </summary>
    private Lazy<Dictionary<string, string>> _configuration;

    /// <summary>
    /// Lazy load database connection
    /// Chỉ kết nối database khi có query đầu tiên
    /// </summary>
    private Lazy<IDisposable> _databaseConnection;

    /// <summary>
    /// Flag kiểm tra đã khởi tạo chưa
    /// </summary>
    private volatile bool _isInitialized = false;

    #endregion

    #region Constructor

    public LazyResourceLoader()
    {
        // Khai báo lazy initialization - chưa load gì cả
        _configuration = new Lazy<Dictionary<string, string>>(
            LoadConfiguration,
            LazyThreadSafetyMode.ExecutionAndPublication
        );

        _databaseConnection = new Lazy<IDisposable>(
            CreateDatabaseConnection,
            LazyThreadSafetyMode.ExecutionAndPublication
        );
    }

    #endregion

    #region Lazy Loaders

    /// <summary>
    /// Hàm này chỉ được gọi đúng 1 lần khi truy cập .Value lần đầu
    /// Nếu không có Lazy, tất cả resources này sẽ được load ngay khi khởi tạo class
    /// </summary>
    private Dictionary<string, string> LoadConfiguration()
    {
        Console.WriteLine("Loading configuration from file... (lazy)");
        // todo - đọc file config thực tế
        Thread.Sleep(200); // giả lập I/O chậm
        return new Dictionary<string, string>
        {
            { "Server", "localhost" },
            { "Port", "5432" },
            { "Timeout", "30" }
        };
    }

    /// <summary>
    /// Kết nối database chỉ được tạo khi có query đầu tiên
    /// </summary>
    private IDisposable CreateDatabaseConnection()
    {
        Console.WriteLine("Creating database connection... (lazy)");
        // todo - tạo kết nối thực tế
        return new MemoryStream(); // giả lập connection
    }

    #endregion

    #region Methods

    /// <summary>
    /// Get config value - có thể trigger lazy load nếu là lần đầu
    /// </summary>
    public string GetConfig(string key)
    {
        // Lazy load xảy ra tại đây nếu chưa được load trước đó
        if (_configuration.Value.TryGetValue(key, out string value))
        {
            return value;
        }
        return null;
    }

    /// <summary>
    /// Thực thi query - trigger lazy load database connection
    /// </summary>
    public async Task ExecuteQueryAsync(string sql)
    {
        // Lazy load connection tại điểm này
        IDisposable connection = _databaseConnection.Value;
        Console.WriteLine($"Executing query on thread {Environment.CurrentManagedThreadId}: {sql}");
        // todo - thực thi query thực tế
        await Task.Delay(50);
    }

    /// <summary>
    /// Kiểm tra xem config đã được load chưa (mà không trigger lazy load)
    /// IsValueCreated: kiểm tra mà không kích hoạt việc tạo
    /// </summary>
    public bool IsConfigurationLoaded => _configuration.IsValueCreated;

    /// <summary>
    /// Kiểm tra xem connection đã được tạo chưa
    /// </summary>
    public bool IsConnectionCreated => _databaseConnection.IsValueCreated;

    #endregion
}

#endregion

#region Lazy với LazyInitializer (không cần Lazy<T>)

/// <summary>
/// LazyInitializer - alternative cho Lazy<T>, nhẹ hơn vì không cần tạo đối tượng Lazy
/// Phù hợp khi muốn tránh allocation của Lazy<T>
/// </summary>
public static class LazyInitializerExample
{
    #region Declare

    /// <summary>
    /// Đối tượng được lazy-initialize bằng LazyInitializer
    /// Không cần khai báo Lazy<T>, chỉ cần field + LazyInitializer.EnsureInitialized
    /// </summary>
    private static volatile LargeResource _largeResource = null;

    /// <summary>
    /// Lock object cho LazyInitializer
    /// </summary>
    private static readonly object _lockObject = new object();

    #endregion

    #region Properties

    /// <summary>
    /// Lazy-initialize property không cần Lazy<T>
    /// EnsureInitialized tự động xử lý double-check locking
    /// </summary>
    public static LargeResource Resource
    {
        get
        {
            LazyInitializer.EnsureInitialized(
                ref _largeResource,
                ref _lockObject,
                () =>
                {
                    Console.WriteLine("Creating LargeResource via LazyInitializer");
                    return new LargeResource();
                }
            );
            return _largeResource;
        }
    }

    #endregion
}

/// <summary>
/// Ví dụ resource nặng cần lazy init
/// </summary>
public class LargeResource
{
    public LargeResource()
    {
        Console.WriteLine("LargeResource constructor: allocating 100MB of data...");
        // todo - thực sự cấp phát tài nguyên nặng
    }

    public void Process()
    {
        Console.WriteLine("Processing data from LargeResource");
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Lazy Initialization
/// </summary>
public class LazyInitializationExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ
    /// </summary>
    public void Run()
    {
        Console.WriteLine("=== Lazy Singleton ===");
        // Instance chưa được tạo cho đến khi truy cập .Instance
        Console.WriteLine("Before accessing Instance (nothing created yet)");
        LazySingleton.Instance.DoWork();  // Lazy<T> tạo instance tại đây

        Console.WriteLine("\n=== Lazy Resource Loader ===");
        LazyResourceLoader loader = new LazyResourceLoader();
        Console.WriteLine($"Config loaded? {loader.IsConfigurationLoaded}");  // false
        Console.WriteLine($"Value: {loader.GetConfig("Server")}");  // trigger lazy load
        Console.WriteLine($"Config loaded? {loader.IsConfigurationLoaded}");  // true

        Console.WriteLine("\n=== LazyInitializer ===");
        // LazyInitializer.EnsureInitialized tạo resource khi truy cập lần đầu
        var resource = LazyInitializerExample.Resource;
        resource.Process();
    }

    #endregion
}
