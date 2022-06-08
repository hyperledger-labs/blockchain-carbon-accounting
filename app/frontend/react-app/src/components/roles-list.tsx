import { FC } from "react";
import { Role, RolesInfo, rolesInfoToArray } from "./static-data";

function RolesListElements({ roles }: { roles: Role[] }) {
  return (
    <>
      {roles.map((role, id) => (
        <div key={id}>{role && <li>{role}&nbsp;&nbsp;</li>}</div>
      ))}
    </>
  );
}

type Props = {
  roles: RolesInfo;
};

const RolesList: FC<Props> = ({ roles }) => {
  const r = rolesInfoToArray(roles);
  if (!r) {
    return <p>No roles found.</p>;
  }

  return (
    <ul>
      <RolesListElements roles={r} />
    </ul>
  );
};

export default RolesList;
