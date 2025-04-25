import * as THREE from 'three';

export const saveTDataToFile = (data: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3, t:number}>, filename: string) => {
  const jsonData = JSON.stringify(
    data.map((entry) => ({
      position: { x: entry.position.x, y: entry.position.y, z: entry.position.z },
      rotation: { x: entry.rotation.x, y: entry.rotation.y, z: entry.rotation.z },
      scale: { x: entry.scale.x, y: entry.scale.y, z: entry.scale.z },
      t: entry.t,
    })),
    null,
    2
  );

  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export const saveDataToFile = (data: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>, filename: string) => {
  const jsonData = JSON.stringify(
    data.map((entry) => ({
      position: { x: entry.position.x, y: entry.position.y, z: entry.position.z },
      rotation: { x: entry.rotation.x, y: entry.rotation.y, z: entry.rotation.z },
      scale: { x: entry.scale.x, y: entry.scale.y, z: entry.scale.z },
    })),
    null,
    2
  );

  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


export const readDataFromFile = (path: string): Promise<any> => {
  console.log(path)
  return fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch file at ${path}: ${response.statusText}`);
      }
      // console.log("second",response)
      return response.json();
    })
    .catch((error) => {
      return Promise.reject(error);
    });
};
