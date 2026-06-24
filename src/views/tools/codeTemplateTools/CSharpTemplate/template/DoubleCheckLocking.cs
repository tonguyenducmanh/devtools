// Design Pattern: Double-Check Locking
// Giảm thiểu overhead của lock bằng cách kiểm tra điều kiện 2 lần
// Lần 1: không lock (nếu instance đã tồn tại thì return ngay)
// Lần 2: sau khi lock (kiểm tra lại để tránh race condition)
// volatile + lock pattern phổ biến trong Singleton và Initialization

namespace TDProject.Core.Business;

#region Singleton với Double-Check Locking

/// <summary>
/// Singleton pattern sử dụng double-check locking
/// volatile + double-check = thread-safe + performance tối ưu
/// Nếu không có volatile, CPU có thể reorder instructions và gán _instance trước khi constructor chạy
/// </summary>
public class DoubleCheckLockingSingleton
{
    #region Declare

    /// <summary>
    /// volatile: ngăn CPU/compiler sắp xếp lại lệnh (instruction reordering)
    /// Đảm bảo _instance chỉ được gán sau khi constructor đã hoàn thành
    /// Nếu không có volatile: _instance = new ... có thể gán _instance trước khi constructor chạy xong
    /// </summary>
    private static volatile DoubleCheckLockingSingleton _instance;

    /// <summary>
    /// Lock object cho double-check locking
    /// </summary>
    private static readonly object _lockObject = new object();

    /// <summary>
    /// Đếm số lần khởi tạo (để verify chỉ 1 instance)
    /// </summary>
    private static int _instanceCount = 0;

    /// <summary>
    /// Timestamp tạo instance
    /// </summary>
    private readonly DateTime _createdAt;

    #endregion

    #region Constructor

    private DoubleCheckLockingSingleton()
    {
        int count = Interlocked.Increment(ref _instanceCount);
        _createdAt = DateTime.Now;

        // Giả lập khởi tạo tốn thời gian (VD đọc config, kết nối...)
        Thread.Sleep(50);
        Console.WriteLine($"Instance #{count} created at {_createdAt:HH:mm:ss.fff} (thread: {Environment.CurrentManagedThreadId})");
    }

    #endregion

    #region Properties

    /// <summary>
    /// Double-check locking thread-safe singleton
    /// Step 1: Kiểm tra không lock (nhanh) - nếu đã có thì return ngay
    /// Step 2: Lock và kiểm tra lại - phòng trường hợp 2 thread cùng vào step 1
    /// volatile + double-check: vừa nhanh vừa đúng
    /// </summary>
    public static DoubleCheckLockingSingleton Instance
    {
        get
        {
            // Lần kiểm tra thứ 1 - không lock, rất nhanh
            // Hầu hết các lần gọi, _instance đã tồn tại nên return luôn, không cần lock
            if (_instance == null)
            {
                // Chỉ khi _instance chưa tồn tại mới cần lock
                lock (_lockObject)
                {
                    // Lần kiểm tra thứ 2 - sau khi lock, kiểm tra lại
                    // Thread 1 vào lock, tạo instance, ra khỏi lock
                    // Thread 2 đang chờ lock, sau khi vào sẽ thấy _instance != null
                    if (_instance == null)
                    {
                        // volatile đảm bảo lệnh gán này không bị reorder với constructor
                        _instance = new DoubleCheckLockingSingleton();
                    }
                }
            }
            return _instance;
        }
    }

    /// <summary>
    /// Thời điểm instance được tạo (để kiểm tra)
    /// </summary>
    public DateTime CreatedAt => _createdAt;

    #endregion

    #region Methods

    public void DoWork()
    {
        Console.WriteLine($"DoubleCheckLockingSingleton working (created at {_createdAt:HH:mm:ss.fff})");
    }

    #endregion
}

#endregion

#region Double-Check Locking cho Initialization Pattern

/// <summary>
/// Double-check locking cho initialization flag
/// Dùng khi cần khởi tạo một lần nhưng không muốn lock mỗi lần kiểm tra
/// </summary>
public class DoubleCheckInitialization
{
    #region Declare

    /// <summary>
    /// volatile flag đánh dấu đã khởi tạo
    /// volatile: các thread khác thấy ngay giá trị mới sau khi ghi
    /// </summary>
    private volatile bool _initialized = false;

    /// <summary>
    /// Lock object cho double-check
    /// </summary>
    private readonly object _lockObject = new object();

    /// <summary>
    /// Tài nguyên được khởi tạo một lần
    /// </summary>
    private Dictionary<string, object> _resources = null;

    #endregion

    #region Methods

    /// <summary>
    /// Khởi tạo tài nguyên với double-check locking
    /// Mỗi method có thể gọi Initialize() nhiều lần, chỉ khởi tạo đúng 1 lần
    /// </summary>
    public void Initialize()
    {
        // Kiểm tra nhanh không lock - hầu hết các lần gọi thì đã initialized rồi
        if (!_initialized)
        {
            lock (_lockObject)
            {
                // Kiểm tra lại sau lock - tránh 2 thread cùng vào lần kiểm tra đầu
                if (!_initialized)
                {
                    DoInitialize();
                    _initialized = true;
                    // volatile: ghi này được flush ngay, các thread khác thấy ngay
                }
            }
        }
    }

    /// <summary>
    /// Hàm khởi tạo thực tế - chỉ chạy đúng 1 lần
    /// </summary>
    private void DoInitialize()
    {
        Console.WriteLine($"Initializing resources on thread {Environment.CurrentManagedThreadId}");
        _resources = new Dictionary<string, object>
        {
            { "config", "loaded" },
            { "cache", new object() },
            { "timestamp", DateTime.Now }
        };
        Thread.Sleep(200); // giả lập công việc nặng
        Console.WriteLine("Initialization complete");
    }

    /// <summary>
    /// Sử dụng tài nguyên
    /// Gọi Initialize an toàn nhiều lần, chỉ khởi tạo 1 lần
    /// </summary>
    public void UseResource()
    {
        Initialize(); // double-check locking bên trong
        Console.WriteLine($"Using resource: {_resources?["config"]}");
    }

    #endregion
}

#endregion

#region Double-Check Locking với Lazy Initialization

/// <summary>
/// Kết hợp double-check locking với lazy load cho nhiều đối tượng
/// </summary>
public class DoubleCheckCache<TKey, TValue>
{
    #region Declare

    /// <summary>
    /// Cache dictionary
    /// </summary>
    private readonly Dictionary<TKey, TValue> _cache = new Dictionary<TKey, TValue>();

    /// <summary>
    /// Factory để tạo value khi cache miss
    /// </summary>
    private readonly Func<TKey, TValue> _factory;

    /// <summary>
    /// Lock object
    /// </summary>
    private readonly object _lockObject = new object();

    #endregion

    #region Constructor

    public DoubleCheckCache(Func<TKey, TValue> factory)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
    }

    #endregion

    #region Methods

    /// <summary>
    /// Lấy value với double-check locking
    /// Nếu cache hit: return ngay, không lock
    /// Nếu cache miss: lock, kiểm tra lại, tạo value, cache, return
    /// </summary>
    public TValue GetOrAdd(TKey key)
    {
        // Lần kiểm tra 1: không lock, nhanh
        if (_cache.TryGetValue(key, out TValue value))
        {
            return value;
        }

        lock (_lockObject)
        {
            // Lần kiểm tra 2: sau lock, kiểm tra lại (tránh race condition)
            if (_cache.TryGetValue(key, out value))
            {
                return value;
            }

            value = _factory(key);
            _cache[key] = value;
            Console.WriteLine($"Cache miss: created value for key '{key}' on thread {Environment.CurrentManagedThreadId}");
            return value;
        }
    }

    /// <summary>
    /// Số lượng items trong cache
    /// </summary>
    public int Count
    {
        get
        {
            lock (_lockObject)
            {
                return _cache.Count;
            }
        }
    }

    #endregion
}

#endregion

/// <summary>
/// Ví dụ sử dụng Double-Check Locking
/// </summary>
public class DoubleCheckLockingExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - test thread-safety của double-check locking
    /// </summary>
    public void Run()
    {
        Console.WriteLine("=== Double-Check Locking Singleton ===");
        // Test với nhiều thread cùng truy cập singleton
        var tasks = new Task[10];
        for (int i = 0; i < tasks.Length; i++)
        {
            tasks[i] = Task.Run(() =>
            {
                var instance = DoubleCheckLockingSingleton.Instance;
                Console.WriteLine($"Thread {Environment.CurrentManagedThreadId} got instance created at {instance.CreatedAt:HH:mm:ss.fff}");
            });
        }
        Task.WaitAll(tasks);

        Console.WriteLine("\n=== Double-Check Initialization ===");
        var initObj = new DoubleCheckInitialization();
        var initTasks = new Task[5];
        for (int i = 0; i < initTasks.Length; i++)
        {
            initTasks[i] = Task.Run(() => initObj.UseResource());
        }
        Task.WaitAll(initTasks);

        Console.WriteLine("\n=== Double-Check Cache ===");
        var cache = new DoubleCheckCache<string, string>(key =>
        {
            Thread.Sleep(100); // giả lập tạo value tốn thời gian
            return $"Value for {key}";
        });

        var cacheTasks = new[]
        {
            Task.Run(() => Console.WriteLine(cache.GetOrAdd("item1"))),
            Task.Run(() => Console.WriteLine(cache.GetOrAdd("item1"))),
            Task.Run(() => Console.WriteLine(cache.GetOrAdd("item2"))),
            Task.Run(() => Console.WriteLine(cache.GetOrAdd("item1"))),
        };
        Task.WaitAll(cacheTasks);

        Console.WriteLine($"\nCache count: {cache.Count} (expected: 2)");
    }

    #endregion
}
