// app.js
const { useState, useEffect, useMemo, useRef } = React;

const CSV_URL = "https://docs.google.com/spreadsheets/d/1geYxUhfSFmX4LhpZOJ7SGfWgaNpWVyVvhqWjT6RAj-I/export?format=csv&gid=0";

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [authData, setAuthData] = useState({ email: '', password: '' });

    const itemsPerPage = 100;

    // Clock Logic
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Firebase Auth Observer
    useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
            setUser(u);
            if (u) fetchData();
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async () => {
        Papa.parse(CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: false,
            complete: (results) => {
                const processed = results.data.map(row => ({
                    ...row,
                    STATUS: row.STATUS === "Completed" ? "Complete" : row.STATUS
                }));
                setData(processed);
            }
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await firebase.auth().signInWithEmailAndPassword(authData.email, authData.password);
        } catch (error) {
            alert("Invalid username or password");
        }
    };

    const handleCellEdit = (index, field, value) => {
        const updatedData = [...data];
        const actualIndex = (currentPage - 1) * itemsPerPage + index;
        updatedData[actualIndex][field] = value;
        setData(updatedData);
        // Firestore sync would happen here
    };

    if (loading) return null;

    if (!user) {
        return (
            <div className="login-overlay">
                <form className="login-box" onSubmit={handleLogin}>
                    <h2>IKU System Login</h2>
                    <input 
                        className="login-input" 
                        type="email" 
                        placeholder="Email" 
                        onChange={e => setAuthData({...authData, email: e.target.value})}
                    />
                    <input 
                        className="login-input" 
                        type="password" 
                        placeholder="Password" 
                        onChange={e => setAuthData({...authData, password: e.target.value})}
                    />
                    <button className="login-btn" type="submit">LOGIN</button>
                </form>
            </div>
        );
    }

    const isAdmin = user.email === 'admin@iku.com';
    const totalRecords = data.length;
    const completeCount = data.filter(r => r.STATUS === 'Complete').length;
    const incompleteCount = data.filter(r => r.STATUS === 'Incomplete').length;
    const activeStaff = [...new Set(data.map(r => r.STAFF).filter(s => s))].length;

    const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="app-container">
            <header className="main-header">
                <div className="header-left">
                    <h1>Senarai Buku IKU</h1>
                    <p>Sistem Pengurusan Koleksi Buku – Tukar DDC kepada NLM/LC</p>
                </div>
                <div className="header-right">
                    <div>{currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    <div style={{ fontWeight: 'bold' }}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                </div>
            </header>

            <div className="kpi-container">
                <KPI label="Total Records" value={totalRecords} />
                <KPI label="Complete" value={completeCount} />
                <KPI label="Incomplete" value={incompleteCount} />
                <KPI label="Staff Active" value={activeStaff} />
            </div>

            <div className="charts-grid">
                <div className="chart-wrapper">
                    <PieChart data={{ complete: completeCount, incomplete: incompleteCount }} />
                </div>
                <div className="chart-wrapper">
                    <BarChart data={data} />
                </div>
            </div>

            <div className="table-controls">
                <h2 style={{ color: '#003366' }}>Pangkalan Data Koleksi</h2>
                <button className="refresh-btn" onClick={fetchData}>🔄 Refresh Data</button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>CONTROL NUMBER</th>
                            <th>CALL NO (082)</th>
                            <th>CALL NO (050/060)</th>
                            <th>ACCESSION</th>
                            <th>TITLE</th>
                            <th>STATUS</th>
                            <th>STAFF</th>
                            <th>DATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.NO}</td>
                                <td><EditableCell value={row['CONTROL NUMBER']} onSave={(v) => handleCellEdit(idx, 'CONTROL NUMBER', v)} /></td>
                                <td>{row['CALL NO (082)']}</td>
                                <td><EditableCell value={row['CALL NO (050/060)']} onSave={(v) => handleCellEdit(idx, 'CALL NO (050/060)', v)} /></td>
                                <td>{row.ACCESSION}</td>
                                <td>{row.TITLE}</td>
                                <td>
  <EditableCell 
    type="status"
    value={row.STATUS} 
    onSave={(v) => handleCellEdit(idx, 'STATUS', v)} 
  />
</td>

<td>
  <EditableCell 
    type="staff"
    value={row.STAFF} 
    onSave={(v) => handleCellEdit(idx, 'STAFF', v)} 
  />
</td>
                                <td><EditableCell value={row.DATE} onSave={(v) => handleCellEdit(idx, 'DATE', v)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                <span>Page {currentPage} of {Math.ceil(data.length / itemsPerPage)}</span>
                <button className="page-btn" disabled={currentPage === Math.ceil(data.length / itemsPerPage)} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
};

const KPI = ({ label, value }) => (
    <div className="kpi-card">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value.toLocaleString()}</div>
    </div>
);

const EditableCell = ({ value, onSave, type }) => {
    const [val, setVal] = useState(value || '');
    useEffect(() => setVal(value || ''), [value]);

    if (type === "status") {
        return (
            <select
                className="editable-input"
                value={val}
                onChange={(e) => {
                    setVal(e.target.value);
                    onSave(e.target.value);
                }}
            >
                <option value="">Select</option>
                <option value="Complete">Complete</option>
                <option value="Incomplete">Incomplete</option>
            </select>
        );
    }

    if (type === "staff") {
        return (
            <select
                className="editable-input"
                value={val}
                onChange={(e) => {
                    setVal(e.target.value);
                    onSave(e.target.value);
                }}
            >
                <option value="">Select</option>
                <option value="FATIHAH">FATIHAH</option>
                <option value="FAZILAH">FAZILAH</option>
                <option value="SAKINAH">SAKINAH</option>
                <option value="HUSNA">HUSNA</option>
                <option value="ALIA">ALIA</option>
                <option value="EYZAN">EYZAN</option>
                <option value="USER">USER</option>
            </select>
        );
    }

    return (
        <input
            className="editable-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => onSave(val)}
        />
    );
};

const PieChart = ({ data }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Complete', 'Incomplete'],
                datasets: [{
                    data: [data.complete, data.incomplete],
                    backgroundColor: ['#003366', '#CCE5FF'],
                    borderWidth: 1
                }]
            },
            options: { maintainAspectRatio: false, plugins: { title: { display: true, text: 'Conversion Status' } } }
        });
    }, [data]);

    return <canvas ref={canvasRef}></canvas>;
};

const BarChart = ({ data }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) chartRef.current.destroy();
        const staffCounts = data.reduce((acc, row) => {
            if (row.STAFF) acc[row.STAFF] = (acc[row.STAFF] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(staffCounts);
        const counts = Object.values(staffCounts);

        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Books Processed',
                    data: counts,
                    backgroundColor: '#0055A5'
                }]
            },
            options: { maintainAspectRatio: false, plugins: { title: { display: true, text: 'Staff Performance' } } }
        });
    }, [data]);

    return <canvas ref={canvasRef}></canvas>;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
