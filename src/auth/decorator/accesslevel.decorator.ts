import { SetMetadata } from "@nestjs/common";
import { AdminAccessLevels } from "src/Enums/all-enums";
import { Admin } from "typeorm";

//decorator for the admitype
export const ADMIN_ACCESS_LEVEL_KEY = 'accesslevel'
export const AdminAccessLevel=(...accesslevel:AdminAccessLevels[])=>SetMetadata(ADMIN_ACCESS_LEVEL_KEY,accesslevel);
