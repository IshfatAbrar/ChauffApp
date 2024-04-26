import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <>
      <div
        className=" h-screen bg-cover bg-center items-center"
        style={{ backgroundImage: "url('signIn.jpg')" }}
      >
        <div className=" absolute top-32 right-0">
          <SignIn />
        </div>
      </div>
    </>
  );
}
