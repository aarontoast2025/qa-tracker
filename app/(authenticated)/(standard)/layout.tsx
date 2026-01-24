export default function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 max-w-5xl p-5">
      {children}
    </div>
  );
}
