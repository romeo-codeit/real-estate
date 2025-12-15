import { Button } from '@/components/ui/button';
import { ICrypto } from '@/lib/types';
import { getCryptos } from '@/services/sanity/crypto.sanity';
import { formatAmount } from '@/lib/helpers';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const Crypto = async () => {
  let cryptoItems: ICrypto[] = [];

  try {
    cryptoItems = await getCryptos();
  } catch (error) {
    console.error('Failed to fetch crypto data:', error);
    cryptoItems = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
      </div>
      <div className="bg-gray-700 text-white p-8 rounded-lg mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Browse Crypto assets</h1>
        <p className="text-lg text-gray-300 mb-6">
          Find the perfect crypto asset to invest in
        </p>
        {/* <SearchFilters /> */}
      </div>

      {cryptoItems.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">No Crypto assets found</h2>
              <p className="text-muted-foreground">Check back later for new investment opportunities.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Crypto Investment Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>24h Change</TableHead>
                    <TableHead>Expected ROI</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Min. Investment</TableHead>
                    <TableHead>Market Cap</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cryptoItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-bold">{item.symbol}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>${item.price?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.change24h && item.change24h > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : item.change24h && item.change24h < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-600" />
                          )}
                          <span className={
                            item.change24h && item.change24h > 0 ? 'text-green-600' :
                            item.change24h && item.change24h < 0 ? 'text-red-600' : 'text-gray-600'
                          }>
                            {item.change24h ? `${item.change24h > 0 ? '+' : ''}${item.change24h}%` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          +{item.expectedROI || 0}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.riskLevel === 'Low' ? 'secondary' :
                          item.riskLevel === 'Medium' ? 'default' : 'destructive'
                        }>
                          {item.riskLevel || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatAmount(item.minInvestment || 0)}</TableCell>
                      <TableCell>{formatAmount(+item?.marketCap || 0)}B</TableCell>
                      <TableCell>
                        <Button asChild size="sm">
                          <Link href={`/crypto/${item._id}`}>
                            Invest
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Crypto;
