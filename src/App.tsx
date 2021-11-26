import { useLayoutEffect, useState } from "react";
import Plot from "react-plotlyjs-ts";
import axios from "axios";
import distance from "euclidean-distance";
import { minBy } from "lodash";

interface MacIrStiprumas {
  mac: string;
  stiprumai: string; // we parse this to json while mapping
}

interface Matavimas {
  matavimas: number;
  x: number;
  y: number;
}

interface DbResp {
  macIrStiprumai: MacIrStiprumas[];
  matavimai: Matavimas[];
  stiprumai: number[][];
}

const getFormattedData = (data: Matavimas[], color: string = "green") => {
  const result = data.reduce(
    (acc: any, curr) => ({
      ...acc,
      x: [...acc.x, curr.x],
      y: [...acc.y, curr.y],
    }),
    {
      name: "Matavimai",
      x: [],
      y: [],
      type: "scatter",
      mode: "markers",
      marker: { color },
    }
  );

  return [result];
};

/**
 * Calculates euclidean distance of each array element and takes the one that has the lowest euclidean distance
 * @param client client intensity array
 * @param intensity intensity 2d array
 * @returns index of measurements
 */
const findClientIndex = (client: number[], intensity: number[][]) => {
  const nearestPoint = minBy(intensity, (measure) => distance(client, measure));
  return intensity.findIndex((measure) => measure === nearestPoint);
};

function App() {
  const [data, setData] = useState<Array<{}>>([]);

  const [intensity, setIntensityData] = useState<number[][]>([[]]);
  const [measures, setMeasuresData] = useState<Matavimas[]>([]);

  // We use layoutEffect because need to load initial data before painting.
  useLayoutEffect(() => {
    axios.get<DbResp>("http://localhost:3333/get-db").then((resp) => {
      // load initial data to state hooks
      setIntensityData(resp.data?.stiprumai);
      setMeasuresData(resp.data?.matavimai);

      // format data for plotting
      const plotData = getFormattedData(resp.data?.matavimai);

      // get client indexes, we will map them to the measurements
      const clientIndexes = resp.data?.macIrStiprumai.map((val) =>
        findClientIndex(JSON.parse(val.stiprumai), resp.data?.stiprumai)
      );
      const colors = ["red", "purple", "black"];

      /**
       * we retrieve 3 indexes and map them with measurements,
       * measurement[foundIndex] is our position.
       * since mac addresses order hasn't changed
       * we can retrieve mac address value by index of the loop
       */
      const plotDataClients = clientIndexes.map((val, i) => ({
        x: [resp.data?.matavimai[val].x],
        y: [resp.data?.matavimai[val].y],
        text: [`Client ${resp.data?.macIrStiprumai[i].mac}`],
        name: `Client ${resp.data?.macIrStiprumai[i].mac}`,
        type: "scatter",
        mode: "markers+text",
        marker: { color: colors[i] },
        textposition: "bottom",
      }));

      // we merge the plot objects into array
      setData([...plotData, ...plotDataClients]);
    });
  }, []);

  const [mac, setMac] = useState("");
  const [measure1, setMeasure1] = useState("");
  const [measure2, setMeasure2] = useState("");
  const [measure3, setMeasure3] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mac || !measure1 || !measure2 || !measure3) {
      alert("Please make sure all the data fields are filled");
      return;
    }
    const newIntensity = [Number(measure1), Number(measure2), Number(measure3)];
    const index = findClientIndex(newIntensity, intensity);
    const obj = {
      x: [measures[index].x],
      y: [measures[index].y],
      text: [`Client ${mac}`],
      name: `Client ${mac}`,
      type: "scatter",
      mode: "markers+text",
      marker: { color: "black" },
      textposition: "bottom",
    };
    setData([...data, obj]);
  };

  return (
    <div>
      <Plot data={data} />
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <label htmlFor="mac">Mac</label>
          <input
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            name="mac"
            id="mac"
          />
          <label htmlFor="measure1">M1</label>
          <input
            value={measure1}
            name="measure1"
            id="measure1"
            onChange={(e) => setMeasure1(e.target.value)}
          />
          <label htmlFor="measure2">M2</label>
          <input
            value={measure2}
            name="measure2"
            id="measure2"
            onChange={(e) => setMeasure2(e.target.value)}
          />
          <label htmlFor="measure3">M3</label>
          <input
            value={measure3}
            name="measure3"
            id="measure3"
            onChange={(e) => setMeasure3(e.target.value)}
          />
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}

export default App;
