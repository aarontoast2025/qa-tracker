export default function WideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 max-w-[1600px] p-5">
      {children}
    </div>
  );
}
