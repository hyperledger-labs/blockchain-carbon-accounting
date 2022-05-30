-- account 0
UPDATE wallet SET name = 'super user (Account 0)', organization = 'Test Hardhat' WHERE lower(address) = lower( '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
-- account 1
UPDATE wallet SET name = 'REC Dealer 1', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
-- account 2
UPDATE wallet
SET name = 'Emissions Auditor 1',
organization = 'Test Hardhat',
public_key_name = 'demo1-public.pem',
public_key = '-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAvbn6wLmWS+0zzi+ABPcw+X1v3lrsZsHt+/R38GrdaZ656WsjoSuf
hgdA1II0ADx0j5ELmCvqzw8dpC2T0lYgyb68zjX6EyosKWTNMiKcFyBkIrl2ilmk
+6JzNWmebpv5p55cAayBUU8Omkn5diaXTYKTrEMlrJeGThyj/At37lTmQvxPJjZo
a/9D9p7vuwpQpQZdKGZ1RU1p+/ZVAfLQXiT6+0Yy2H67J15QZ3eUzcOMu2SPDgQD
Pu/zANdzde+vHYSw9VURO40B7IehLFllsvl9E1Hx9jFn8ExnVVLsJ2Vc78nOSBOd
18H5c6n5eV+6tglXQMolnCjKelYTC3CxH1NeJ3LcKi9RfWv8zNGdm/yRm47t79De
W7yQI6XV/xykyuj7JijSfhDM2fHm1w4iQriFCV4vwdoJp09w+nNxYwApAkFUco5f
ZzoOHUG3CdTcWoj2h1vjB704Q/QF7N9M74BZyq53NOk9RO2Ur2Xhs7vP1S7LDWxU
kMm6c6bLXEqr6CWUWuWeOUXsV8vOY/7zGX1+crULXll9urFeG+EM+GC1FMo7zAgz
BOJP3Eo6Dv8fc15YPsRpnXty0+khlBIQAuxgsf8r05nqBT4bd1BVR7GSgSMfQabf
tMOOx2oLGriVPF8ahSWM6xaflk+lAc73w+yt8Ozj1kTqYxD7gLW6dy0CAwEAAQ==
-----END RSA PUBLIC KEY-----'
WHERE lower(address) = lower( '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
-- account 3
UPDATE wallet SET name = 'Offset Dealer 1', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x90F79bf6EB2c4f870365E785982E1f101E93b906');
-- account 4
UPDATE wallet
SET name = 'Emissions Auditor 2',
organization = 'Test Hardhat',
public_key_name = 'demo2-public.pem',
public_key = '-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEA8XZYc7pibvGlM9DKF931TrGnFFYnhQeq6wbu7M/kwZl81A21TJ1X
GVluZwWE0wQLBI/IJYk5Q5t73PM73z60yM6VJqaBlD5PxbuaazBxqfr/eDPfifSn
iaByz9Wi/QPU1FDzhLT4372qVG5YQYECQnRVK9IBC/RrSG3N6o0lk2rNqtk+9gAl
KKCa4np/Gk7goZrJ8C/nc5EId5Fo20heZlUvEkEcxI8HNXyoSPFijomW17wrFddV
ZHzMjn1p8ujxLGUCNxO5AZMPrI8DTWT4RK92POE+4NQ6npN8EZJAhF7KpYjt02Hd
q7LwQQ8xJ4xFlCO/PCEb6kJMH6eAYp9bttxh+Bu+9APkwQ7lNR6wX+Gn2xBw4ptF
3BtrmqQil0vN33oyCqgweEIr00fsJWJI1ncmQFyn3wqrOxCXo+3faI/rrf7ldMPL
TvYidp5VRrt+Mbjqk3QxrmFQaTDl+17qt82ZHnhH1ICtijGZraDFeTygD/OikYE9
piZMD1LqfQPZM18uP6LzVD8cSywNy/OumLZ2HYeQ5CYAwtilbRT2r5qLAzJmQIOv
j0FLKvPtHRUgXdafOPU0CGlyH+gMLQkQhytH2JuxLi6iykYmGN2QJoaOol/6hq6/
9mRpIOUBzdOYOnW8XvdKZF1dm2u9a5C3jWvBwaqXnvDyCF6j/j4DDqkCAwEAAQ==
-----END RSA PUBLIC KEY-----'
WHERE lower(address) = lower( '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65');
-- account 19
UPDATE wallet SET name = 'Consumer 1', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199');
-- account 18
UPDATE wallet SET name = 'Consumer 2', organization = 'Test Hardhat' WHERE lower(address) = lower( '0xdD2FD4581271e230360230F9337D5c0430Bf44C0');
-- account 5
UPDATE wallet SET name = 'Emissions Auditor 3', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc');
-- account 6
UPDATE wallet SET name = 'Emissions Auditor 4', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x976EA74026E726554dB657fA54763abd0C3a0aa9');
-- account 7
UPDATE wallet SET name = 'Offset Dealer 2', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955');

-- account 13
UPDATE wallet SET name = 'U.S. O&G Producer', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x1cbd3b2770909d4e10f157cabc84c7264073c9ec');
-- account 14
UPDATE wallet SET name = 'Natural Gas Utility Co.', organization = 'Test Hardhat' WHERE lower(address) = lower( '0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097');

-- account 15
UPDATE wallet SET name = 'Bakken O&G Producer', organization = 'Test Hardhat' WHERE lower(address) = lower( '0xcd3B766CCDd6AE721141F452C550Ca635964ce71');
-- account 16
UPDATE wallet SET name = 'Niobrara O&G Producer', organization = 'Test Hardhat' WHERE lower(address) = lower( '0x2546BcD3c84621e976D8185a91A922aE77ECEc30');
-- account 17
UPDATE wallet SET name = 'Permian O&G Producer', organization = 'Test Hardhat' WHERE lower(address) = lower( '0xbda5747bfd65f08deb54cb465eb87d40e51b197e');

-- account 8
UPDATE wallet SET name = 'UPS', organization = 'UPS' WHERE lower(address) = lower( '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f');
-- account 9
UPDATE wallet SET name = 'Air France', organization = 'Air France' WHERE lower(address) = lower( '0xa0ee7a142d267c1f36714e4a8f75612f20a79720');

-- -- account 10
-- 0xbcd4042de499d14e55001ccbb24a551f3b954096
-- -- account 11
-- 0x71be63f3384f5fb98995898a86b02fb2426c5788
-- -- account 12
-- 0xfabb0ac9d68b0b445fb7357272ff202c5651694a
-- -- account 13
-- 0x1cbd3b2770909d4e10f157cabc84c7264073c9ec
-- -- account 14
-- 0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097
-- -- account 17
-- 0xbda5747bfd65f08deb54cb465eb87d40e51b197e

