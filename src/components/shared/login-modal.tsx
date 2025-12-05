import useQueryParams from '@/hooks/useQueryParams';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';

type Props = {
  open: boolean;
  onClose?: () => void;
};

const LoginModal = ({ open, onClose }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { getQueryParams } = useQueryParams();

  const urlQuery = getQueryParams();

  const params = new URLSearchParams(urlQuery);

  return (
    <div>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle>Login</DialogTitle>
          <p>Login is required to continue the investment</p>
          <Button
            onClick={() =>
              router.push(`/login?redirect=${pathname}?${params.toString()}`)
            }
          >
            Login
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginModal;
