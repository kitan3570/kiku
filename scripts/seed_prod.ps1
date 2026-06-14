$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiZGVtbyIsImlhdCI6MTc4MTQ0MTIzOSwiZXhwIjoxNzgxNDQyMTM5fQ.HY4mR08gTjmpocBriX0kXxg1c5--ok5OpfjZqAsTIwA'

# Test import
$words = @(
  @{word='食べる';kana='たべる';romaji='taberu';meaning='吃';example_ja='毎朝パンを食べます。';example_zh='每天早上吃面包。'},
  @{word='勉強';kana='べんきょう';romaji='benkyou';meaning='学习';example_ja='日本語を勉強しています。';example_zh='正在学习日语。'},
  @{word='綺麗';kana='きれい';romaji='kirei';meaning='漂亮、干净';example_ja='今日は綺麗な空ですね。';example_zh='今天的天空真漂亮呢。'},
  @{word='猫';kana='ねこ';romaji='neko';meaning='猫';example_ja='猫が好きです。';example_zh='喜欢猫。'},
  @{word='犬';kana='いぬ';romaji='inu';meaning='狗';example_ja='犬を飼っています。';example_zh='养了一只狗。'}
)

$body = @{words=$words} | ConvertTo-Json -Depth 4 -Compress

$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $result = Invoke-RestMethod -Uri 'https://kiku-api.onrender.com/api/words/import' -Method Post -Headers $headers -Body $body
    Write-Host "Import result: $($result.message)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}

# Test review
try {
    $review = Invoke-RestMethod -Uri 'https://kiku-api.onrender.com/api/review/today' -Method Get -Headers $headers
    Write-Host "Review count: $($review.count)"
    $review.words | ForEach-Object { Write-Host "$($_.word) - $($_.meaning)" }
} catch {
    Write-Host "Review error: $($_.Exception.Message)"
}
