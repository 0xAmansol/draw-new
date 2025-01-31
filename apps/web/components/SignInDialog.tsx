import { DialogContent } from "@radix-ui/react-dialog";
import { HTTP_URL } from "@workspace/backend-common/config";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useToast } from "@workspace/ui/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

function SignInDialog() {
  const id = useId();
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const signInHandler = async () => {
    try {
      console.log(`attempting sign in with:`, formData);
      const res = await axios.post(`${HTTP_URL}/signin`, {
        email: formData.email,
        password: formData.password,
      });
      if (!res) {
        toast({
          title: "Error signing in",
          description: "Error",
        });
      }
      const token = res.data.token;
      localStorage.setItem("token", token);

      toast({
        title: "user signed in",
      });
      router.push("/canvas/9");
    } catch (error) {
      toast({
        title: `error signing in: ${error}`,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Sign in</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <svg
              className="stroke-zinc-800 dark:stroke-zinc-100"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">Welcome back</DialogTitle>
            <DialogDescription className="sm:text-center">
              Enter your credentials to login to your account.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input
                id={`${id}-email`}
                placeholder="hi@yourcompany.com"
                type="email"
                required
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <Input
                id={`${id}-password`}
                placeholder="Enter your password"
                type="password"
                required
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                }}
              />
            </div>
          </div>

          <Button type="button" className="w-full" onClick={signInHandler}>
            Sign in
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SignInDialog };
