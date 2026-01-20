window.Shipping = (function(){
  const cfg = CONFIG;

  const state = {
    dept: "",
    mun: "",
    courier: Object.keys(cfg.couriers)[0] || "",
    direccion: ""
  };

  function setDept(d){ state.dept = d; }
  function setMun(m){ state.mun = m; }
  function setCourier(c){ state.courier = c; }
  function setDireccion(d){ state.direccion = d; }
  function getState(){ return {...state}; }

  function calcShipping(){
    if(!Object.keys(Cart.getItems()).length) return 0;

    if(state.dept === "Comayagua" && state.mun === "Comayagua"){
      return cfg.comayaguaLocalZones["Centro"] || 0;
    }
    if(state.dept === "Comayagua"){
      return cfg.comayaguaLocalZones["Juterique/Lejamaní/VillaSanAntonio/Flores"] || 0;
    }
    if(state.dept === "La Paz"){
      return (cfg.laPazRange.min + cfg.laPazRange.max)/2;
    }
    return cfg.couriers[state.courier] || 0;
  }

  function populateDepartamentos(select){
    cfg.departamentos.forEach(d=>{
      const o = document.createElement("option");
      o.value = d; o.textContent = d;
      select.appendChild(o);
    });
  }

  function populateMunicipios(select, dept){
    select.innerHTML = "";
    if(!dept){
      select.innerHTML = '<option value="">Elige departamento</option>';
      return;
    }
    const list = cfg.municipiosPorDepartamento[dept] || cfg.municipiosPorDepartamento.defaultSample;
    list.forEach(m=>{
      const o = document.createElement("option");
      o.value = m; o.textContent = m;
      select.appendChild(o);
    });
    if(dept === "Comayagua"){
      select.value = "Comayagua";
      state.mun = "Comayagua";
    }
  }

  function populateCouriers(select){
    select.innerHTML = "";
    Object.keys(cfg.couriers).forEach(c=>{
      const o = document.createElement("option");
      o.value = c;
      o.textContent = `${c} (base ${Utils.formatL(cfg.couriers[c])})`;
      select.appendChild(o);
    });
    select.value = state.courier;
  }

  return {
    setDept, setMun, setCourier, setDireccion,
    getState, calcShipping,
    populateDepartamentos, populateMunicipios, populateCouriers
  };
})();
