// Nuevo componente: ActivePreBills.jsx
import React, { useState, useEffect } from 'react';
import { 
Box, Typography, Paper, Button, Table, TableBody,
TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

function ActivePreBills({ onContinuePreBill }) {
const [activePreBills, setActivePreBills] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
fetchActivePreBills();
}, []);

const fetchActivePreBills = async () => {
setLoading(true);
try {
    const response = await fetch('http://localhost:5000/api/prebills/active');
    if (response.ok) {
    const data = await response.json();
    setActivePreBills(data);
    }
} catch (error) {
    console.error('Error:', error);
} finally {
    setLoading(false);
}
};

return (
<Box sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
    Prefacturaciones Activas
    </Typography>
    
    <TableContainer component={Paper}>
    <Table>
        <TableHead>
        <TableRow>
            <TableCell>Empresa</TableCell>
            <TableCell>Contrato</TableCell>
            <TableCell>Paciente</TableCell>
            <TableCell>Servicios</TableCell>
            <TableCell>Valor Total</TableCell>
            <TableCell>Acciones</TableCell>
        </TableRow>
        </TableHead>
        <TableBody>
        {loading ? (
            <TableRow>
            <TableCell colSpan={6} align="center">Cargando...</TableCell>
            </TableRow>
        ) : activePreBills.length === 0 ? (
            <TableRow>
            <TableCell colSpan={6} align="center">No hay prefacturaciones activas</TableCell>
            </TableRow>
        ) : (
            activePreBills.map(preBill => (
            <TableRow key={preBill._id}>
                <TableCell>{preBill.companyName}</TableCell>
                <TableCell>{preBill.contractName}</TableCell>
                <TableCell>{preBill.patientDocument ? `Doc: ${preBill.patientDocument}` : 'N/A'}</TableCell>
                <TableCell>{preBill.services.length}</TableCell>
                <TableCell>${preBill.totalValue.toLocaleString()}</TableCell>
                <TableCell>
                <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => onContinuePreBill(preBill)}
                >
                    Continuar
                </Button>
                </TableCell>
            </TableRow>
            ))
        )}
        </TableBody>
    </Table>
    </TableContainer>
</Box>
);
}

export default ActivePreBills;