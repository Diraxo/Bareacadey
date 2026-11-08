/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Vehicle = require('../models/Vehicle')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const VehicleExpense = require('../models/VehicleExpense')
const SubTrip = require('../models/SubTrip')
const State = require('../models/State')
const VehicleType = require('../models/VehicleType')
const Classification = require('../models/Classification')
const Ownership = require('../models/Ownership')

const VehicleDocument = require('../models/VehicleDocument')
const RentalCost = require('../models/RentalCost')
const EmissionCost = require('../models/EmissionCost')

const VehicleValue = require("../models/VehicleValue");
const MilageCost = require("../models/MilageCost");
const RegistrationCost = require("../models/RegistrationCost");
const WasteDesposal = require("../models/WasteDesposal");
const Tax = require("../models/Tax");

const GeotabApi = require('mg-api-js');

const authentication = {
  credentials: {
    database: process.env.GEOTAB_DATABASE,
    userName: process.env.GEOTAB_USERNAME,
    password: process.env.GEOTAB_PASSWORD,
  },
  path: process.env.GEOTAB_SERVER,
  options: {
    rememberMe: true
  }
};

const api = new GeotabApi(authentication);


route.get("/", verifyRoles(Roles?.vehicle_findAllRoles), async (req, res) => {
  try {
    await Vehicle.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByVehicle",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByVehicle",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
          ],
          through: { attributes: [] },
          as: "Drivers",
        },
        {
          model: State,
          attributes: [
            "name",
            "alpha_code",
          ],
        },
        {
          model: VehicleType,
          attributes: [
            "type",
          ],
        },
        {
          model: Classification,
          attributes: [
            "classification",
          ],
        },
        {
          model: Ownership,
          attributes: [
            "ownership",
          ],
        },
      ],
    }).then(async (vehiclesList) => {
      
      let updatedVehicles = []
      await Promise.all(
        vehiclesList.map(async (vehicle) => {
          const upload_added_by = vehicle?.AddedByVehicle?.upload_id && await UserUpload.findOne({
            where: { id: vehicle?.AddedByVehicle?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = vehicle?.UpdatedByVehicle?.upload_id && await UserUpload.findOne({
            where: { id: vehicle?.UpdatedByVehicle?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedVehicles.push({
            ...vehicle.toJSON(),
            added_user_name: vehicle?.AddedByVehicle?.full_name,
            updated_user_name: vehicle?.UpdatedByVehicle?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            first_name_mtm_target_2: vehicle?.Drivers?.map((item)=>item["full_name"])?.join(', '),
            alpha_code_target_3: vehicle?.State?.alpha_code,
            type_target_8: vehicle?.VehicleType?.type,
            classification_target_9: vehicle?.Classification?.classification,
            ownership_target_10: vehicle?.Ownership?.ownership,
            AddedByVehicle: {
              name: vehicle?.AddedByVehicle?.full_name,
              url: fullUrlAddedBy,
              id: vehicle?.AddedByVehicle?.id
            },
            UpdatedByVehicle: {
              name: vehicle?.UpdatedByVehicle?.full_name,
              url: fullUrlUpdatedBy,
              id: vehicle?.UpdatedByVehicle?.id
            },
          });
        })
      );
      res.json(updatedVehicles.sort((a, b) => b.id - a.id));
    });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       res.send({ error: true, message: e?.message });
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.get("/:id", verifyRoles(Roles?.vehicle_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    const vehicleDocuments = await VehicleDocument.count({
      where: {
        vehicle_id: id
      }
    });

    // const rentalCostsLatest = await BaseContract.findOne({
    //   where: {
    //     user_parent_id: id
    //   },
    //   order: [ [ 'createdAt', 'DESC' ]],
    // })

    const rentalCostsCount = await RentalCost.count({
      where: {
        vehicle_parent_id: id
      }
    })
    
    const emissionCostsCount = await EmissionCost.count({
      where: {
        vehicle_parent_id: id
      }
    })

     const vehicleValuesCount = await VehicleValue.count({
       where: {
         vehicle_parent_id: id,
       },
     });

     const milageCostsCount = await MilageCost.count({
       where: {
         vehicle_parent_id: id,
       },
     });

     const registrationCostsCount = await RegistrationCost.count({
       where: {
         vehicle_parent_id: id,
       },
     });

     const wasteDesposalsCount = await WasteDesposal.count({
       where: {
         vehicle_parent_id: id,
       },
     });

     const taxesCount = await Tax.count({
       where: {
         vehicle_parent_id: id,
       },
     });
    
    await Vehicle.findOne({
      where: { id: id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByVehicle",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByVehicle",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
          ],
          through: { attributes: [] },
          as: "Drivers",
        },
        {
          model: State,
          attributes: [
            "name",
            "alpha_code",
          ],
        },
        {
          model: VehicleType,
          attributes: [
            "type",
          ],
        },
        {
          model: Classification,
          attributes: [
            "classification",
          ],
        },
        {
          model: Ownership,
          attributes: [
            "ownership",
          ],
        },
      ],
    }).then(async (vehicle) => {
          if(!vehicle) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = vehicle?.AddedByVehicle?.upload_id && await UserUpload.findOne({
            where: { id: vehicle?.AddedByVehicle?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = vehicle?.UpdatedByVehicle?.upload_id && await UserUpload.findOne({
            where: { id: vehicle?.UpdatedByVehicle?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;

          

      let updatedVehicle = {
        ...vehicle.toJSON(),
        added_user_name:
          vehicle?.AddedByVehicle?.full_name,
        updated_user_name:
          vehicle?.UpdatedByVehicle?.full_name,
        added_user_url: fullUrlAddedBy,
        updated_user_url: fullUrlUpdatedBy,
        alpha_code_target_3: vehicle?.State?.alpha_code ?? "",
        type_target_8: vehicle?.VehicleType?.type ?? "",
        classification_target_9: vehicle?.Classification?.classification ?? "",
        ownership_target_10: vehicle?.Ownership?.ownership ?? "",
        vehicleDocuments: vehicleDocuments,
        rentalCostsCount: rentalCostsCount,
        emissionCostsCount: emissionCostsCount,

        vehicleValuesCount: vehicleValuesCount,
        milageCostsCount: milageCostsCount,
        registrationCostsCount: registrationCostsCount,
        wasteDesposalsCount: wasteDesposalsCount,
        taxesCount: taxesCount,

        first_name_mtm_target_2: vehicle?.Drivers?.map(
          (item) => item["full_name"]
        )?.join(", "),
        AddedByVehicle: {
          name:
            vehicle?.AddedByVehicle?.full_name,
          url: fullUrlAddedBy,
          id: vehicle?.AddedByVehicle?.id,
        },
        UpdatedByVehicle: {
          name:
            vehicle?.UpdatedByVehicle?.full_name,
          url: fullUrlUpdatedBy,
          id: vehicle?.UpdatedByVehicle?.id,
        },
      };
      res.json(updatedVehicle);
    });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       res.send({ error: true, message: e?.message });
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.post("/", verifyRoles(Roles?.vehicle_createRoles), async (req, res) => {
  try {
    const {
      _unitNumber,
      _plateNumber,
      _type,
      _vinNumber,
      _year,
      _active,
      _make,
      _model,
      _eldBrand,
      _eldSerialNumer,
      _inboundMile,
      _outboundMile,
      _dateOfInspection,
      _date_operation_started,
      _reason_for_inactivity,
      _driver_id,
      _state_id,
      _vehicletype_id,
      _classification_id,
      _ownership_id,
      _vehicle_value,
      _cost,
      _cost_period,
      _milage_cost,
      _emission_cost,
      _registratoin_cost,
      _waste_disposal,
      _tax,
      _vehicle_id,

    } = req.body;
    const vehicle = await Vehicle.create({
      unitNumber: _unitNumber,
      plateNumber: _plateNumber,
      type: _type,
      vinNumber: _vinNumber,
      year: _year,
      active: _active,
      make: _make,
      model: _model,
      eldBrand: _eldBrand,
      eldSerialNumer: _eldSerialNumer,
      inboundMile: _inboundMile,
      outboundMile: _outboundMile,
      dateOfInspection: _dateOfInspection,
      date_operation_started: _date_operation_started,
      reason_for_inactivity: _reason_for_inactivity,
      state_id: _state_id,
      vehicletype_id: _vehicletype_id,
      classification_id: _classification_id,
      ownership_id: _ownership_id,
      added_by: req.user.id,
      updated_by: req.user.id,
      vehicle_value: _vehicle_value,
      // cost: _cost,
      // cost_period: _cost_period,
      milage_cost: _milage_cost,
      // emission_cost: _emission_cost,
      registratoin_cost: _registratoin_cost,
      waste_disposal: _waste_disposal,
      tax: _tax,
      vehicle_id: _vehicle_id,
    })
    if(_driver_id) {
      let ids = _driver_id?.split(",")
      await vehicle.setDrivers(ids)
    }
    await Activity.create({
      activity: `vehicle "${_unitNumber}"`,
      type: "created",
      added_by: req.user.id,
    });
    return res.json({ message: "Successfully Created" });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.put("/", verifyRoles(Roles?.vehicle_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _unitNumber,
      _plateNumber,
      _type,
      _vinNumber,
      _year,
      _active,
      _make,
      _model,
      _eldBrand,
      _eldSerialNumer,
      _inboundMile,
      _outboundMile,
      _dateOfInspection,
      _date_operation_started,
      _reason_for_inactivity,
      _driver_id,
      _state_id,
      _vehicletype_id,
      _classification_id,
      _ownership_id,
      _vehicle_value,
      _cost,
      _cost_period,
      _milage_cost,
      _emission_cost,
      _registratoin_cost,
      _waste_disposal,
      _tax,
      _vehicle_id,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const vehicle = await Vehicle.findOne({
      where: { id: id },
    })
    if(!vehicle) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(vehicle) {
      if(_unitNumber != null) {
        vehicle.unitNumber = _unitNumber;
      }
      if(_plateNumber != null) {
        vehicle.plateNumber = _plateNumber;
      }
      if(_type != null) {
        vehicle.type = _type;
      }
      if(_vinNumber != null) {
        vehicle.vinNumber = _vinNumber;
      }
      if(_year != null) {
        vehicle.year = _year;
      }
      if(_active != null) {
        vehicle.active = _active;
      }
      if(_make != null) {
        vehicle.make = _make;
      }
      if(_model != null) {
        vehicle.model = _model;
      }
      if(_eldBrand != null) {
        vehicle.eldBrand = _eldBrand;
      }
      if(_eldSerialNumer != null) {
        vehicle.eldSerialNumer = _eldSerialNumer;
      }
      if(_inboundMile != null) {
        vehicle.inboundMile = _inboundMile;
      }
      if(_outboundMile != null) {
        vehicle.outboundMile = _outboundMile;
      }
      if(_dateOfInspection != null) {
        vehicle.dateOfInspection = _dateOfInspection;
      }
      if(_date_operation_started != null) {
        vehicle.date_operation_started = _date_operation_started;
      }
      if(_reason_for_inactivity != null) {
        vehicle.reason_for_inactivity = _reason_for_inactivity;
      }
      if(_state_id) {
        vehicle.state_id = _state_id;
      }
      if(_vehicletype_id) {
        vehicle.vehicletype_id = _vehicletype_id;
      }
      if(_classification_id) {
        vehicle.classification_id = _classification_id;
      }
      if(_ownership_id) {
        vehicle.ownership_id = _ownership_id;
      }

      if(_vehicle_value != null) {
        vehicle.vehicle_value = _vehicle_value;
      }
      // if(_cost != null) {
      //   vehicle.cost = _cost;
      // }
      // if(_cost_period != null) {
      //   vehicle.cost_period = _cost_period;
      // }
      if(_milage_cost != null) {
        vehicle.milage_cost = _milage_cost;
      }
      // if(_emission_cost != null) {
      //   vehicle.emission_cost = _emission_cost;
      // }
      if(_registratoin_cost != null) {
        vehicle.registratoin_cost = _registratoin_cost;
      }
      if(_waste_disposal != null) {
        vehicle.waste_disposal = _waste_disposal;
      }
      if(_tax != null) {
        vehicle.tax = _tax;
      }
      if(_vehicle_id != null) {
        vehicle.vehicle_id = _vehicle_id;
      }


      vehicle.updated_by = req.user.id;
      await vehicle.save();
      if(_driver_id != null) {
        let ids = _driver_id?.split(",")
        if(!_driver_id) {
          vehicle.setDrivers([])
        }
        else {
          vehicle.setDrivers([])
          vehicle.setDrivers(ids)
        }
      }
      await Activity.create({
        activity: `vehicle "${vehicle?.unitNumber}"`,
        type: "updated",
        added_by: req.user.id,
      });
    }
    return res.json({ message: "Successfully Updated" });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.delete("/", verifyRoles(Roles?.vehicle_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const vehicle = await Vehicle.findOne({
      where: { id: id },
    })
    if(!vehicle) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const vehicleExpenses_unitNumber_40 = await VehicleExpense.findAll({ where: {vehicle_id: id } });
    if(vehicleExpenses_unitNumber_40.length > 0) {
      return res.json({error: true, message: `Delete vehicleExpenses related to this vehicle first!`})
    }

    const subTrips_unitNumber_518 = await SubTrip.findAll({ where: {vehicle_id: id } });
    if(subTrips_unitNumber_518.length > 0) {
      return res.json({error: true, message: `Delete subTrips related to this vehicle first!`})
    }

    const vehicleDocuments_unitNumber_260 = await VehicleDocument.findAll({ where: {vehicle_id: id } });
    if(vehicleDocuments_unitNumber_260.length > 0) {
      return res.json({error: true, message: `Delete vehicleDocuments related to this vehicle first!`})
    }

    await Activity.create({
      activity: `vehicle "${vehicle?.unitNumber}"`,
      type: "deleted",
      added_by: req.user.id,
    });
    Vehicle.destroy({where: {id: id } });
    return res.json({ message: "Successfully Deleted" });
  } catch (e) {
    if(e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if(e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({error: true, message: "Something went wrong"})
    }
  }
});

route.post("/load_vehicles/geotab", verifyRoles(Roles?.vehicle_createRoles), async (req, res) => {
  try {
    let vehicles = await Vehicle.findAll()
    let newVehicles = []

    const deviceStatusInfo = await api.call("Get", {
      typeName: "DeviceStatusInfo",
    })
    
    const data = await api.call("Get", {
      typeName: "Device",
    })
    // return res.json(data)
    let allVehicles = data?.filter((device)=>(device?.vehicleIdentificationNumber && device?.licensePlate && device?.serialNumber))
    let totalVehicles = 0
    const users = await User.findAll()
    await Promise.all(
      allVehicles?.map( async (dt)=>{
        let existed = false;
        vehicles?.map((vehicle)=>{
          if(vehicle?.unitNumber == dt?.name || vehicle?.plateNumber == dt?.licensePlate) {
            existed = true;
          }
        })
        newVehicles?.map((vehicle)=>{
          if(vehicle?.unitNumber == dt?.name || vehicle?.plateNumber == dt?.licensePlate) {
            existed = true;
          }
        })
        

        let active = false;
        if((new Date(dt?.activeFrom) < new Date()) && new Date(dt?.activeTo) > new Date())  {
          active = true;
        }

        if(!active) {
          if(existed) {
            const vhc = await Vehicle.findOne({
              where: {unitNumber: dt?.name}
            })
            if(vhc) {
              vhc.active = false
              vhc.vehicletype_id = 1
              vhc.eldBrand="Geotab"
              vhc.save()
            }
          }
          // return;
        } else if(active) {
          if(existed) {
            const vhc = await Vehicle.findOne({
              where: {unitNumber: dt?.name}
            })
            if(vhc) {
              vhc.active = true
              vhc.vehicletype_id = 1
              vhc.eldBrand="Geotab"
              vhc.save()
            }
            return;
          }
        }

        if(existed) return;

        let drivers = []
        deviceStatusInfo?.map((dsi)=>{
          if(dsi?.device?.id == dt?.id) {
            const drvs = dsi?.driver?.driverGroups??[]
            if(drvs && drvs?.length > 0) {
              drvs?.map((d)=> {
                let id;
                users?.map((user)=>{
                  if(user?.driverId == dt?.id) {
                    id = user?.id;
                  }
                })
                if(id && !drivers?.includes(id)) drivers.push(id);
              })
            }
          }
        })

        const fd = {
          unitNumber: dt?.name,
          plateNumber: dt?.licensePlate,
          vinNumber: dt?.vehicleIdentificationNumber,
          vehicle_id: dt?.id,
          active: active,
          drivers: drivers,
          eldSerialNumer: dt?.serialNumber,
        };
        newVehicles.push(fd)
        totalVehicles++;

        const vehicle = await Vehicle.create({
          unitNumber: fd?.unitNumber,
          plateNumber: fd?.plateNumber,
          vinNumber: fd?.vinNumber,
          active: fd?.active,
          eldSerialNumer: fd?.eldSerialNumer,
          vehicle_id: fd?.vehicle_id,
          added_by: req.user.id,
          updated_by: req.user.id,
        })
        if(fd?.drivers) {
          let ids = fd?.drivers
          await vehicle.setDrivers(ids)
        }

      })
    )


    if(totalVehicles > 0 ) {
      await Activity.create({
        activity: `${totalVehicles} new ${totalVehicles == 1 ? "vehicle" : "vehicles"} from geotab`,
        type: "created",
        added_by: req.user.id,
      });
      return res.status(200).send({ message: "Successfully Loaded "+totalVehicles+(totalVehicles == 1 ? " Vehicle" : " Vehicles") });
    }
    if(data?.length > 0) {
      return res.status(200).send({ error: true, message: "All vehicles already existed!" });
    }
    else {
      return res.status(200).send({ error: true, message: "Geotab loading error!" });
    }
   
   
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

module.exports = route