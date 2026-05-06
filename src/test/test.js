import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // 30秒內緩慢增加到 50 人
    { duration: "1m", target: 150 }, // 1分鐘內增加到 150 人（觀察轉折點）
    { duration: "30s", target: 300 }, // 衝刺到 300 人
    { duration: "1m", target: 300 }, // 維持 300 人高壓運作
    { duration: "30s", target: 0 }, // 冷卻，讓伺服器恢復
  ],
  thresholds: {
    // 設定合格門檻：如果 95% 請求超過 1 秒，測試算失敗
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"], // 失敗率必須低於 1%
  },
};

export default function () {
  const res = http.get("https://aep-store.vercel.app/");

  // 檢查回應是否正常
  check(res, {
    "is status 200": (r) => r.status === 200,
  });

  // 模擬真實使用者行為：停頓 1 到 3 秒（比固定的 sleep(1) 更真實）
  sleep(Math.random() * 2 + 1);
}
