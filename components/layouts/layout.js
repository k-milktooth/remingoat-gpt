import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Layout({ children }) {
  return (
    <div className="bg-neutral-800 px-6 text-white lg:px-12 xl:px-20">
      <Navbar />

      <main className="mx-auto">{children}</main>

      <Footer />
    </div>
  );
}
