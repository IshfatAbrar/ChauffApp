import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div>
      <div className=" absolute top-32 right-0">
        <SignUp />
      </div>
    </div>
  );
}
