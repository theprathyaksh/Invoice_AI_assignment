import { useSelector } from "react-redux";
import Table from "../components/Table"; // Assuming this component is handling table rendering

const Products = () => {
  // Retrieve the products data from the Redux store
  const products = useSelector((state) => state.products);

  // Define the table columns
  const columns = [
    { key: "name", header: "Product Name" },
    { key: "qty", header: "Quantity" },
    { key: "unitPrice", header: "Unit Price" },
    { key: "tax", header: "Tax" },
    { key: "priceWithTax", header: "Price with Tax" },
  ];

  // If there are no products, display a message
  if (!products || products.length === 0) {
    return (
      <div className="flex justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3">Products</h2>
          <p>No products available.</p>
        </div>

      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Products</h2>
      {/* Pass products data and columns to the Table component */}
      <Table data={products} columns={columns} />
    </div>
  );
};

export default Products;
