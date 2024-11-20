import { useSelector } from "react-redux";
import Table from "../components/Table"; // Assuming this component is handling table rendering

const Customers = () => {
  // Retrieve the customers data from the Redux store
  const customers = useSelector((state) => state.customers);

  // Define the table columns
  const columns = [
    { key: "name", header: "Customer Name" },
    { key: "phone", header: "Phone Number" },
    { key: "totalPurchase", header: "Total Purchase Amount" },
  ];

  // If there are no customers, display a message
  if (!customers || customers.length === 0) {
    return (
      <div className="flex justify-center min-h-screen">
        <div className="text-center">
        <h2 className="text-xl font-semibold mb-3">Customers</h2>
        <p>No customers available.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Customers</h2>
      {/* Pass customers data and columns to the Table component */}
      <Table data={customers} columns={columns} />
    </div>
  );
};

export default Customers;
