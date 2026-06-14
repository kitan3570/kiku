@echo off
curl -s -X POST https://kiku-api.onrender.com/api/words/import ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiZGVtbyIsImlhdCI6MTc4MTQ0MTMxNSwiZXhwIjoxNzgxNDQyMjE1fQ.w8I_Nfwsb8UGXUBhclu9N6BuXr9Ka22ceIT96bHlKI8" ^
  -H "Content-Type: application/json" ^
  -d "{\"words\":[{\"word\":\"test\",\"kana\":\"test\",\"meaning\":\"test\"}]}"
