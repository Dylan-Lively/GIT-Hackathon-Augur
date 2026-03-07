
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
        <h1 className="text-3xl font-bold">hello world</h1>
<button 
  onClick={runSimulation}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Test Connection
</button>

        </>
    )
}
