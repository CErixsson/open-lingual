import React, { useEffect, useState } from 'react';
import { fetchData } from '../api';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchData();
                if (result) {
                    setData(result);
                } else {
                    setError('No data available.');
                }
            } catch (err) {
                setError('An error occurred while fetching data.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Dashboard</h1>
            {/* Render your data here */}
            {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <div>No data to display.</div>}
        </div>
    );
};

export default Dashboard;