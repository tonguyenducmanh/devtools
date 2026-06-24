// Design Pattern: Decorator
// Thêm các hành vi mới vào đối tượng một cách linh hoạt mà không cần thay đổi class gốc
// Pattern này phù hợp khi cần mở rộng chức năng theo nhiều tổ hợp khác nhau

namespace TDProject.Core.Business;

#region Component Interface

/// <summary>
/// Interface cho dịch vụ gửi thông báo
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Gửi thông báo
    /// </summary>
    void Send(string message);
}

#endregion

#region Concrete Component

/// <summary>
/// Component cơ bản - gửi thông báo qua console
/// </summary>
public class ConsoleNotification : INotificationService
{
    public void Send(string message)
    {
        Console.WriteLine($"[Console] {message}");
    }
}

#endregion

#region Base Decorator

/// <summary>
/// Base decorator giữ reference đến component được wrap
/// </summary>
public abstract class NotificationDecorator : INotificationService
{
    /// <summary>
    /// Component được wrap (có thể là component gốc hoặc decorator khác)
    /// </summary>
    protected readonly INotificationService _wrapped;

    protected NotificationDecorator(INotificationService wrapped)
    {
        _wrapped = wrapped;
    }

    /// <summary>
    /// Decorator gọi method của component được wrap
    /// và có thể thêm hành vi trước/sau
    /// </summary>
    public abstract void Send(string message);
}

#endregion

#region Concrete Decorators

/// <summary>
/// Decorator thêm chức năng log
/// </summary>
public class LoggingDecorator : NotificationDecorator
{
    public LoggingDecorator(INotificationService wrapped)
        : base(wrapped) { }

    public override void Send(string message)
    {
        // Thêm hành vi trước khi gọi component gốc
        Console.WriteLine($"[LoggingDecorator] Sending notification at {DateTime.Now:HH:mm:ss}");

        // Gọi component được wrap
        _wrapped.Send(message);

        // Thêm hành vi sau khi gọi
        Console.WriteLine($"[LoggingDecorator] Notification sent successfully");
    }
}

/// <summary>
/// Decorator thêm chức năng gửi email (bổ sung)
/// </summary>
public class EmailDecorator : NotificationDecorator
{
    public EmailDecorator(INotificationService wrapped)
        : base(wrapped) { }

    public override void Send(string message)
    {
        // Gọi component gốc trước
        _wrapped.Send(message);

        // Thêm chức năng gửi email
        Console.WriteLine($"[EmailDecorator] Sending email with message: {message}");
        // todo - gửi email thực tế
    }
}

/// <summary>
/// Decorator thêm chức năng nén message
/// </summary>
public class CompressionDecorator : NotificationDecorator
{
    public CompressionDecorator(INotificationService wrapped)
        : base(wrapped) { }

    public override void Send(string message)
    {
        // Nén message trước khi gửi
        string compressedMessage = $"[COMPRESSED]{message}[/COMPRESSED]";
        Console.WriteLine($"[CompressionDecorator] Compressed message: {compressedMessage}");

        // Gọi component gốc với message đã nén
        _wrapped.Send(compressedMessage);
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Decorator Pattern
/// </summary>
public class DecoratorExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - các decorator được wrap lồng nhau linh hoạt
    /// </summary>
    public void Run()
    {
        // Có thể kết hợp các decorator theo bất kỳ thứ tự nào
        INotificationService service = new ConsoleNotification();

        // Thêm logging
        service = new LoggingDecorator(service);

        // Thêm email
        service = new EmailDecorator(service);

        // Thêm compression
        service = new CompressionDecorator(service);

        // Khi gọi Send, tất cả các decorator đều được thực thi theo thứ tự
        service.Send("Hello, this is a test notification!");

        Console.WriteLine();

        // Hoặc chỉ dùng 1 số decorator
        INotificationService simpleService = new LoggingDecorator(new ConsoleNotification());
        simpleService.Send("Simple notification with logging only");
    }

    #endregion
}
