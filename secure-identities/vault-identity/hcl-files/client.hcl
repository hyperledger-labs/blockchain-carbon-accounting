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

# For ethereum keys
path "secret/data/eth-{{identity.entity.name}}"{
    capabilities = [ "create", "update", "read", "delete", "list" ]
}

# For UI
path "transit/keys/*"{
        capabilities = [ "list" ]
}