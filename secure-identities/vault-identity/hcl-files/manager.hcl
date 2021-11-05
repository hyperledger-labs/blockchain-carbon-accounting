# For signing
path "transit/sign/{{identity.entity.name}}"{
    capabilities = [ "update" ]
}
# For Keys
path "transit/keys/{{identity.entity.name}}"{
    capabilities = [ "create", "update", "read", "delete", "list" ]
}
    
# For key Rotate
path "transit/keys/{{identity.entity.name}}/rotate"{
    capabilities = [ "update" ]
}

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

# For ethereum keys
path "secret/data/eth-{{identity.entity.name}}"{
    capabilities = [ "create", "update", "read", "delete", "list" ]
}

# for UI
path "*" {
    capabilities = [ "list","read" ] 
}
