# For changing password
path "auth/userpass/users/{{identity.entity.name}}/password"{
    capabilities = [ "update" ]   
}

# for creating user pass auth for client
path "auth/userpass/users/*"{
    capabilities = [ "create","list" ]   
}

# for creating entity for client
path "identity/entity"{
    capabilities = [ "update","list" ]   
}

# for creating entity alias for client
path "identity/entity-alias"{
    capabilities = [ "update","list" ]   
}

# for UI
path "*" {
    capabilities = [ "list","read" ] 
}
