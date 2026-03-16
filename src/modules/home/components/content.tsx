import Link from "next/link";

const Content = () => {
  return (
    <section className="relative left-1/2 w-full max-w-7xl -translate-x-1/2 py-16">
      <div className="mx-auto max-w-5xl px-6">
        {/* 區塊標題 */}
        <h3 className="mb-12 text-center text-3xl font-semibold text-neutral-800">
          聯絡我們
        </h3>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* 左：聯絡表單 */}
          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-700"
              >
                姓名
              </label>
              <input
                id="name"
                type="text"
                placeholder="您的姓名"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700"
              >
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-neutral-700"
              >
                訊息內容
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="請輸入您的留言"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-block rounded bg-indigo-600 px-6 py-2 text-neutral-100 transition hover:bg-indigo-700"
            >
              送出留言
            </button>
          </form>

          {/* 右：公司資訊 */}
          <div className="space-y-4 text-neutral-700">
            <p>如果你有任何問題，歡迎透過以下方式與我們聯絡：</p>
            <div>
              <h4 className="font-medium">電話</h4>
              <p>+886 2 1234 5678</p>
            </div>
            <div>
              <h4 className="font-medium">電子郵件</h4>
              <p>support@aepstore.com</p>
            </div>
            <div>
              <h4 className="font-medium">地址</h4>
              <p>台北市信義區信義路五段7號</p>
            </div>
            <div className="flex items-center space-x-4 pt-4">
              {/* 可換成你的社群 icon */}
              <Link
                href="#"
                aria-label="Facebook"
                className="hover:text-indigo-600"
              >
                <svg className="h-6 w-6" /* ... */></svg>
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="hover:text-indigo-600"
              >
                <svg className="h-6 w-6" /* ... */></svg>
              </Link>
              <Link
                href="#"
                aria-label="LinkedIn"
                className="hover:text-indigo-600"
              >
                <svg className="h-6 w-6" /* ... */></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Content;
