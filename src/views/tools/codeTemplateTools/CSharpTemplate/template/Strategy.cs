// Design Pattern: Strategy
// Định nghĩa một họ các thuật toán, đóng gói chúng và làm cho chúng có thể hoán đổi cho nhau
// Pattern này phù hợp khi có nhiều cách xử lý khác nhau và muốn thay đổi linh hoạt tại runtime

namespace TDProject.Core.Business;

#region Strategy Interface

/// <summary>
/// Strategy interface cho việc nén dữ liệu
/// Các strategy cụ thể sẽ implement interface này
/// </summary>
public interface ICompressionStrategy
{
    /// <summary>
    /// Nén dữ liệu
    /// </summary>
    byte[] Compress(byte[] data);

    /// <summary>
    /// Giải nén dữ liệu
    /// </summary>
    byte[] Decompress(byte[] data);
}

#endregion

#region Concrete Strategies

/// <summary>
/// Strategy nén GZip
/// </summary>
public class GZipCompression : ICompressionStrategy
{
    public byte[] Compress(byte[] data)
    {
        // todo - nén GZip
        Console.WriteLine($"Compressing {data.Length} bytes using GZip");
        return data;
    }

    public byte[] Decompress(byte[] data)
    {
        // todo - giải nén GZip
        Console.WriteLine($"Decompressing {data.Length} bytes using GZip");
        return data;
    }
}

/// <summary>
/// Strategy nén Brotli
/// </summary>
public class BrotliCompression : ICompressionStrategy
{
    public byte[] Compress(byte[] data)
    {
        // todo - nén Brotli
        Console.WriteLine($"Compressing {data.Length} bytes using Brotli");
        return data;
    }

    public byte[] Decompress(byte[] data)
    {
        // todo - giải nén Brotli
        Console.WriteLine($"Decompressing {data.Length} bytes using Brotli");
        return data;
    }
}

/// <summary>
/// Strategy không nén (NoOp)
/// </summary>
public class NoCompression : ICompressionStrategy
{
    public byte[] Compress(byte[] data)
    {
        Console.WriteLine("No compression applied");
        return data;
    }

    public byte[] Decompress(byte[] data)
    {
        Console.WriteLine("No decompression needed");
        return data;
    }
}

#endregion

#region Context

/// <summary>
/// Context sử dụng strategy, có thể thay đổi strategy tại runtime
/// Không cần sửa đổi class này khi thêm strategy mới (Open/Closed Principle)
/// </summary>
public class CompressionContext
{
    /// <summary>
    /// Strategy hiện tại, có thể thay đổi khi chạy
    /// </summary>
    private ICompressionStrategy _strategy;

    /// <summary>
    /// Khởi tạo với strategy mặc định
    /// </summary>
    public CompressionContext(ICompressionStrategy strategy)
    {
        _strategy = strategy;
    }

    /// <summary>
    /// Thay đổi strategy tại runtime
    /// </summary>
    public void SetStrategy(ICompressionStrategy strategy)
    {
        _strategy = strategy;
    }

    /// <summary>
    /// Nén dữ liệu bằng strategy hiện tại
    /// </summary>
    public byte[] Compress(byte[] data)
    {
        return _strategy.Compress(data);
    }

    /// <summary>
    /// Giải nén dữ liệu bằng strategy hiện tại
    /// </summary>
    public byte[] Decompress(byte[] data)
    {
        return _strategy.Decompress(data);
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Strategy Pattern
/// </summary>
public class StrategyExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - strategy có thể thay đổi linh hoạt khi chạy
    /// </summary>
    public void Run()
    {
        byte[] sampleData = new byte[1000];

        // Dùng strategy GZip
        CompressionContext context = new CompressionContext(new GZipCompression());
        byte[] compressed = context.Compress(sampleData);
        byte[] decompressed = context.Decompress(compressed);

        // Đổi sang Brotli khi chạy
        context.SetStrategy(new BrotliCompression());
        compressed = context.Compress(sampleData);
    }

    #endregion
}
