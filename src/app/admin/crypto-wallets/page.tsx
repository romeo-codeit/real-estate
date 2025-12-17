'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';
import cryptoWalletsService from '@/services/supabase/crypto-wallets.service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CryptoWallet {
  id: string;
  symbol: string;
  name: string;
  wallet_address: string;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function AdminCryptoWalletsPage() {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<CryptoWallet | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    wallet_address: '',
    enabled: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await cryptoWalletsService.getCryptoWallets();
      setWallets(data || []);
    } catch (error: any) {
      console.error('Error loading wallets:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load crypto wallets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.symbol || !formData.name || !formData.wallet_address) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingWallet) {
        await cryptoWalletsService.updateCryptoWallet(editingWallet.id, formData);
        toast({
          title: 'Success',
          description: 'Crypto wallet updated successfully.',
        });
      } else {
        await cryptoWalletsService.createCryptoWallet(formData);
        toast({
          title: 'Success',
          description: 'Crypto wallet created successfully.',
        });
      }

      setDialogOpen(false);
      setEditingWallet(null);
      setFormData({ symbol: '', name: '', wallet_address: '', enabled: true });
      loadWallets();
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save crypto wallet.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (wallet: CryptoWallet) => {
    setEditingWallet(wallet);
    setFormData({
      symbol: wallet.symbol,
      name: wallet.name,
      wallet_address: wallet.wallet_address,
      enabled: wallet.enabled,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crypto wallet?')) return;

    try {
      await cryptoWalletsService.deleteCryptoWallet(id);
      toast({
        title: 'Success',
        description: 'Crypto wallet deleted successfully.',
      });
      loadWallets();
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete crypto wallet.',
        variant: 'destructive',
      });
    }
  };

  const toggleEnabled = async (wallet: CryptoWallet) => {
    try {
      await cryptoWalletsService.updateCryptoWallet(wallet.id, { enabled: !wallet.enabled });
      toast({
        title: 'Success',
        description: `Crypto wallet ${!wallet.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
      loadWallets();
    } catch (error: any) {
      console.error('Error toggling wallet:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update crypto wallet.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Crypto Wallets</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWallets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingWallet(null);
                setFormData({ symbol: '', name: '', wallet_address: '', enabled: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Crypto Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWallet ? 'Edit' : 'Add'} Crypto Wallet</DialogTitle>
                <DialogDescription>
                  Configure a cryptocurrency wallet for deposits.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="symbol" className="text-right">
                      Symbol
                    </Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      placeholder="BTC"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bitcoin"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet_address" className="text-right">
                      Wallet Address
                    </Label>
                    <Input
                      id="wallet_address"
                      value={formData.wallet_address}
                      onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                      placeholder="bc1q..."
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="enabled" className="text-right">
                      Enabled
                    </Label>
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingWallet ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crypto Wallets ({wallets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.symbol}</TableCell>
                  <TableCell>{wallet.name}</TableCell>
                  <TableCell className="font-mono text-sm">{wallet.wallet_address}</TableCell>
                  <TableCell>
                    <Badge variant={wallet.enabled ? 'default' : 'secondary'}>
                      {wallet.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(wallet.created_at || '').toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleEnabled(wallet)}>
                          {wallet.enabled ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(wallet)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(wallet.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {wallets.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No crypto wallets configured yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}