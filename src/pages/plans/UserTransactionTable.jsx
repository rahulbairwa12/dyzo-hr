import React from 'react';
import TransactionTable from './TransactionTable';

const UserTransactionTable = () => {
    return (
        <div>
            {/* Directly render the TransactionTable component which now handles its own data fetching */}
            <TransactionTable />
        </div>
    );
};

export default UserTransactionTable;
