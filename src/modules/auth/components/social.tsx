import { Button } from "@/components/ui/button";

interface SocialProps {
  pending: boolean;
  onSocial: (provider: "facebook" | "google") => Promise<void>;
}

const Social = ({ pending, onSocial }: SocialProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-2">
      <Button
        type="button"
        variant={"default"}
        disabled={pending}
        onClick={() => onSocial("google")}
      >
        Google
      </Button>
      <Button type="button" variant={"default"} disabled={pending}>
        facebook
      </Button>
    </div>
  );
};

export default Social;
