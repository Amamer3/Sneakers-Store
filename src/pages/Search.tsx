import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Product } from '@/types/product'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchQuery = formData.get('search') as string
    setSearchParams({ q: searchQuery })
  }

  useEffect(() => {
    const searchProducts = async () => {
      if (!query) return
      setLoading(true)
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Failed to search products')
        const data = await response.json()

        // Transform the response data to match the Product type
        const transformedProducts: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          images: item.images.map((url: string, index: number) => ({
            id: `${item.id}-image-${index}`,
            url,
            order: index,
          })),
          category: item.category,
          inStock: true, // You might want to get this from the API
          featured: false, // You might want to get this from the API
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          description: item.description,
          sizes: item.sizes || [],
        }))

        setProducts(transformedProducts)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to search products',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    searchProducts()
  }, [query, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              name="search"
              placeholder="Search products..."
              defaultValue={query}
              className="w-full pl-10"
            />
          </div>
        </form>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Search
