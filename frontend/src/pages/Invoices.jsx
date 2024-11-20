import { useSelector } from "react-redux";
import Table from "../components/Table"; // Assuming this component is handling table rendering

const Invoices = () => {
  // Retrieve the invoices data from the Redux store
  const invoices = useSelector((state) => state.invoices);

  // Define the table columns
  const columns = [
    { key: "serial", header: "Serial Number" },
    { key: "customer", header: "Customer Name" },
    { key: "product", header: "Product Name" },
    { key: "qty", header: "Quantity" },
    { key: "tax", header: "Tax" },
    { key: "total", header: "Total Amount" },
    { key: "date", header: "Date" },
  ];

  // If there are no invoices, display a message
  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3">Invoices</h2>
          <p>No invoices available.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Invoices</h2>
      {/* Pass invoices data and columns to the Table component */}
      <Table data={invoices} columns={columns} />
    </div>
  );
};

export default Invoices;
