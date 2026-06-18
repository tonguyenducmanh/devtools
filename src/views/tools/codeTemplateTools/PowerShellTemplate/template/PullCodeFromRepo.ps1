# Thực hiện di chuyển vào từng folder đã config, thực hiện chuyển sang nhánh cụ thể và pull code mới nhất về
# Danh sách repositories [Đường dẫn, Tên, Branch]
$repos = @(
    @("D:\Develop\DevTool", "Dev tools", "main"),
    @("D:\Develop\DevToolV2", "Dev tools v2", "main"),
)

$headerColor = "Cyan"
$processColor = "Green"
$successColor = "Yellow"
$highlightColor = "Magenta"

# In tiêu đề với khung nổi bật
Write-Host "`n`n===============================================" -ForegroundColor $headerColor
Write-Host "===       AUTO PULL CODE REPOSITORIES       ===" -ForegroundColor $headerColor
Write-Host "===============================================`n" -ForegroundColor $headerColor

# Hàm pull code từ repository
function Pull-Code {
    param ($path, $name, $branch)
    
    Write-Host "---------------------------------------------" -ForegroundColor $processColor
    Write-Host "[PROCESS] Đang xử lý: $name" -ForegroundColor $highlightColor
    Write-Host "---------------------------------------------" -ForegroundColor $processColor
    
    cd $path
    Write-Host ">> Đường dẫn: " -NoNewline
    Write-Host "$path" -ForegroundColor $processColor
    Write-Host ">> Branch:    " -NoNewline 
    Write-Host "$branch" -ForegroundColor $processColor
    
    Write-Host "> git stash" -ForegroundColor DarkGray
    git stash
    Write-Host "> git checkout $branch" -ForegroundColor DarkGray
    git checkout $branch
    Write-Host "> git pull" -ForegroundColor DarkGray
    git pull
    Write-Host "> git stash pop" -ForegroundColor DarkGray
    git stash pop
    
    Write-Host "[SUCCESS] Pull code " -NoNewline -ForegroundColor $successColor
    Write-Host "$name" -NoNewline -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host " thành công!`n" -ForegroundColor $successColor
}

# Pull code từ tất cả repositories
foreach ($repo in $repos) {
    Pull-Code -path $repo[0] -name $repo[1] -branch $repo[2]
}

# In kết quả cuối cùng với khung nổi bật
Write-Host "`n***********************************************" -ForegroundColor $successColor
Write-Host "*                                             *" -ForegroundColor $successColor
Write-Host "*         ĐÃ PULL TOÀN BỘ CODE XONG          *" -ForegroundColor $successColor  
Write-Host "*                                             *" -ForegroundColor $successColor
Write-Host "***********************************************`n" -ForegroundColor $successColor

Read-Host "Nhấn Enter để thoát"