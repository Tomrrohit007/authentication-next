import Navbar from "./_components/navbar";

const ProtectLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen py-4 flex flex-col gap-y-10 items-center justify-center bg-sky-500 overflow-y-scroll">
      <Navbar />
      {children}
    </div>
  );
};

export default ProtectLayout;
