// Design Pattern: Observer
// Định nghĩa mối quan hệ một-nhiều giữa các đối tượng, khi đối tượng thay đổi trạng thái,
// tất cả các đối tượng phụ thuộc đều được thông báo và cập nhật tự động

namespace TDProject.Core.Business;

#region Observer Interfaces

/// <summary>
/// Interface cho observer - đối tượng nhận thông báo
/// </summary>
public interface IObserver
{
    /// <summary>
    /// Được gọi khi subject có thay đổi
    /// </summary>
    void Update(string message);
}

/// <summary>
/// Interface cho subject - đối tượng phát thông báo
/// </summary>
public interface ISubject
{
    /// <summary>
    /// Đăng ký observer
    /// </summary>
    void Attach(IObserver observer);

    /// <summary>
    /// Hủy đăng ký observer
    /// </summary>
    void Detach(IObserver observer);

    /// <summary>
    /// Thông báo đến tất cả observers
    /// </summary>
    void Notify(string message);
}

#endregion

#region Subject

/// <summary>
/// Subject quản lý danh sách observers và thông báo khi có sự kiện
/// Có thể mở rộng để hỗ trợ các loại sự kiện khác nhau
/// </summary>
public class TaskStatusSubject : ISubject
{
    #region Declare

    /// <summary>
    /// Danh sách observers đã đăng ký
    /// </summary>
    private readonly List<IObserver> _observers = new List<IObserver>();

    /// <summary>
    /// Object lock cho thread-safe
    /// </summary>
    private readonly object _lockObject = new object();

    #endregion

    #region Methods

    /// <summary>
    /// Đăng ký observer mới
    /// </summary>
    public void Attach(IObserver observer)
    {
        lock (_lockObject)
        {
            if (!_observers.Contains(observer))
            {
                _observers.Add(observer);
                Console.WriteLine($"Observer attached: {observer.GetType().Name}");
            }
        }
    }

    /// <summary>
    /// Hủy đăng ký observer
    /// </summary>
    public void Detach(IObserver observer)
    {
        lock (_lockObject)
        {
            _observers.Remove(observer);
            Console.WriteLine($"Observer detached: {observer.GetType().Name}");
        }
    }

    /// <summary>
    /// Thông báo đến tất cả observers đã đăng ký
    /// </summary>
    public void Notify(string message)
    {
        List<IObserver> observersSnapshot;

        lock (_lockObject)
        {
            observersSnapshot = new List<IObserver>(_observers);
        }

        foreach (IObserver observer in observersSnapshot)
        {
            try
            {
                observer.Update(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error notifying observer {observer.GetType().Name}: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Giả lập thay đổi trạng thái công việc
    /// </summary>
    public void SimulateTaskStatusChange(string taskName, string status)
    {
        string message = $"Task '{taskName}' changed to status: {status}";
        Console.WriteLine($"Subject: {message}");
        // Thông báo cho tất cả observers
        Notify(message);
    }

    #endregion
}

#endregion

#region Concrete Observers

/// <summary>
/// Observer ghi log khi có thay đổi
/// </summary>
public class LoggingObserver : IObserver
{
    public void Update(string message)
    {
        // todo - ghi log ra file hoặc database
        Console.WriteLine($"[LoggingObserver] Logging: {message}");
    }
}

/// <summary>
/// Observer gửi email thông báo
/// </summary>
public class EmailNotificationObserver : IObserver
{
    public void Update(string message)
    {
        // todo - gửi email thực tế
        Console.WriteLine($"[EmailNotificationObserver] Sending email: {message}");
    }
}

/// <summary>
/// Observer cập nhật UI
/// </summary>
public class UIObserver : IObserver
{
    public void Update(string message)
    {
        // todo - cập nhật giao diện người dùng
        Console.WriteLine($"[UIObserver] Updating UI: {message}");
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Observer Pattern
/// </summary>
public class ObserverExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ
    /// </summary>
    public void Run()
    {
        TaskStatusSubject subject = new TaskStatusSubject();

        // Đăng ký các observers
        IObserver logger = new LoggingObserver();
        IObserver emailer = new EmailNotificationObserver();
        IObserver ui = new UIObserver();

        subject.Attach(logger);
        subject.Attach(emailer);
        subject.Attach(ui);

        // Khi task thay đổi trạng thái, tất cả observers đều được thông báo
        subject.SimulateTaskStatusChange("ExportData", "Running");
        subject.SimulateTaskStatusChange("ExportData", "Completed");

        // Hủy đăng ký email observer
        subject.Detach(emailer);
        subject.SimulateTaskStatusChange("ImportData", "Failed");
    }

    #endregion
}
