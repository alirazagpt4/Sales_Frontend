import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../api/axiosClient';

const SaleOrder = () => {
    const [orders, setOrders] = useState([]);
    const [viewOrder, setViewOrder] = useState(null);

    useEffect(()=>{
       
        const fetchOrders = async ()=>{
            try {
                const response = await API.get('/sale-orders');
                console.log("Fetched sale orders:", response.data.orders);
                setOrders(response.data.orders);
            } catch (error) {
                console.error("Error fetching sale orders:", error);
                
            }
        }
        fetchOrders();
    } , [])


  return (
   <>
   <div style={{ padding: '20px' }}>
            <h2>Sale Orders List</h2>

            {/* --- MASTER TABLE --- */}
            <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th>Order No</th>
                        <th>Customer</th>
                        <th>Sales Person</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>{order.order_no}</td>
                            <td>{order.customerDetails?.customer_name}</td>
                            <td>{order.userDetails?.name}</td>
                            <td>{order.total_amount}</td>
                            <td>{order.status}</td>
                            <td>
                                <button onClick={() => setViewOrder(order)}>View Detail</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{ margin: '40px 0' }} />

            {/* --- DETAIL VIEW (Sirf tab dikhega jab View button dabe ga) --- */}
            {viewOrder && (
                <div style={{ background: '#f9f9f9', padding: '15px', border: '1px solid #ccc' }}>
                    <h3>Details for Order: {viewOrder.order_no}</h3>
                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewOrder.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.itemDetails?.item_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unit_price}</td>
                                    <td>{item.subtotal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={() => setViewOrder(null)} style={{ marginTop: '10px' }}>Close Detail</button>
                </div>
            )}
        </div>
    
   </>
  )
}

export default SaleOrder
