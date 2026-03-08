export default function MainPage() {
    async function runSimulation() {
        const response = await fetch("http://localhost:8080/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preset: "coffee_shop" })
        });
        const data = await response.json();
        console.log(data);
    }
    return (
        <>
            <button 
                onClick={runSimulation}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg"
            >
                Test Connection
            </button>
        </>
    )
}