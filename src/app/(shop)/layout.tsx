export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto my-12 max-w-7xl ">{children}</div>
  );
}
